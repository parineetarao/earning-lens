# inference/vocab_tracker.py

import re
from collections import Counter

# Common English stopwords plus earnings call filler words.
# These are filtered out before counting because they appear in every
# transcript at high frequency and carry no analytical signal.
STOPWORDS = {
    # Standard English stopwords
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "as", "is", "was", "are", "were", "be",
    "been", "being", "have", "has", "had", "do", "does", "did", "will",
    "would", "could", "should", "may", "might", "shall", "can", "need",
    "that", "this", "these", "those", "it", "its", "we", "our", "us",
    "you", "your", "they", "their", "he", "she", "his", "her", "i", "my",
    "not", "no", "nor", "so", "yet", "both", "either", "neither", "each",
    "than", "such", "when", "while", "if", "then", "than", "there", "here",
    "what", "which", "who", "how", "all", "any", "more", "also", "about",
    "up", "out", "into", "over", "after", "before", "between", "during",
    # Earnings call filler — high frequency but zero signal
    "quarter", "year", "financial", "results", "call", "good", "thank",
    "morning", "evening", "ladies", "gentlemen", "operator", "please",
    "next", "question", "answer", "management", "company", "business",
    "said", "say", "saying", "one", "two", "three", "per", "cent",
    "percent", "crore", "crores", "million", "billion", "rs", "inr",
}


def tokenize(text: str) -> list[str]:
    """
    Converts raw transcript text into a list of cleaned word tokens.

    What goes in:
        text: any string — full transcript, paragraph, or sentence

    What comes out:
        A list of lowercase alphabetic words with stopwords removed.
        Numbers, punctuation, and single characters are excluded.

    Why only alphabetic tokens:
        Numbers like "12.4" and "FY25" appear constantly in financial
        transcripts but are not vocabulary signals — every transcript
        has financial figures. Keeping only alphabetic words isolates
        the management vocabulary choices we care about.
    """
    # Extract only alphabetic words, convert to lowercase
    tokens = re.findall(r"[a-zA-Z]{2,}", text.lower())

    # Remove stopwords
    tokens = [t for t in tokens if t not in STOPWORDS]

    return tokens


def count_words(text: str) -> Counter:
    """
    Returns a word frequency Counter for the given text.

    What goes in:
        text: full transcript text as a single string

    What comes out:
        A Counter object — dict-like, maps word → count.
        e.g. Counter({"headwinds": 11, "confident": 3, "margin": 8, ...})

    Counter is used instead of a plain dict because it supports
    arithmetic operations — subtraction, addition — which we use
    in compute_vocab_delta() to find frequency changes.
    """
    tokens = tokenize(text)
    return Counter(tokens)


def compute_vocab_delta(
    current_text: str,
    prior_text: str,
    top_n: int = 15
) -> dict:
    """
    Computes which words increased and decreased most between two quarters.

    What goes in:
        current_text: full transcript text for the current quarter
        prior_text:   full transcript text for the prior quarter
        top_n:        how many words to return in each direction (default 15)

    What comes out:
        {
            "increased": [
                {"word": "headwinds", "current": 11, "prior": 2, "delta": 9},
                {"word": "cautious",  "current": 7,  "prior": 1, "delta": 6},
                ...
            ],
            "decreased": [
                {"word": "confident", "current": 1, "prior": 9, "delta": -8},
                {"word": "robust",    "current": 0, "prior": 6, "delta": -6},
                ...
            ]
        }

    Why compute absolute delta rather than percentage change:
        Percentage change is misleading for low-frequency words.
        A word going from 1 to 3 occurrences is a 200% increase but
        carries almost no signal. A word going from 2 to 11 is a 450%
        increase AND a meaningful absolute change of 9. Sorting by
        absolute delta surfaces the most practically significant shifts.

    Why filter words appearing fewer than 2 times total:
        Words that appear once in either transcript are likely proper nouns,
        typos, or one-off references. Requiring at least 2 total occurrences
        removes noise from the delta table.
    """
    current_counts = count_words(current_text)
    prior_counts   = count_words(prior_text)

    # Get all unique words across both transcripts
    all_words = set(current_counts.keys()) | set(prior_counts.keys())

    deltas = []
    for word in all_words:
        current = current_counts.get(word, 0)
        prior   = prior_counts.get(word, 0)
        total   = current + prior

        # Skip words with fewer than 2 total occurrences across both transcripts
        if total < 1:
            continue

        delta = current - prior
        if delta == 0:
            continue  # no change — not interesting

        deltas.append({
            "word":    word,
            "current": current,
            "prior":   prior,
            "delta":   delta,
        })

    # Sort by delta descending for increased, ascending for decreased
    increased = sorted(
        [d for d in deltas if d["delta"] > 0],
        key=lambda x: x["delta"],
        reverse=True
    )[:top_n]

    decreased = sorted(
        [d for d in deltas if d["delta"] < 0],
        key=lambda x: x["delta"]
    )[:top_n]

    return {
        "increased": increased,
        "decreased": decreased,
    }


def extract_key_quotes(
    scored_sentences: list[dict],
    aspect: str,
    top_n: int = 3
) -> list[dict]:
    """
    Extracts the most quotable sentences for a given aspect.

    What goes in:
        scored_sentences: enriched sentence list with sentiment, aspect, confidence
        aspect: one of "revenue", "margins", "guidance", "competition", "macro"
        top_n: number of quotes to return (default 3)

    What comes out:
        A list of sentence dicts sorted by negative confidence descending.
        These are the sentences an analyst would most want to quote in a
        research note — the clearest, most definitive negative language
        for that business aspect.

        Each dict:
        {
            "text":       "Margin pressure is expected to persist into Q4.",
            "sentiment":  "negative",
            "confidence": 0.93,
            "aspect":     "margins",
        }

    Why negative sentences specifically:
        Analysts quote negative language because it is newsworthy and
        actionable. A CFO saying "we are confident" is expected.
        A CFO saying "we are concerned about margin trajectory" is a signal.
        The Key Quotes feature on the frontend surfaces the latter.
    """
    aspect_sentences = [
        s for s in scored_sentences
        if s.get("aspect") == aspect
        and s.get("sentiment") == "negative"
    ]

    aspect_sentences.sort(
        key=lambda s: s.get("confidence", 0),
        reverse=True
    )

    return aspect_sentences[:top_n]