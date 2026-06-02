# inference/aspect_classifier.py

from config import ASPECT_KEYWORDS


def classify_aspect(sentence_text: str) -> str:
    """
    Assigns a business aspect label to a sentence using keyword matching.

    What goes in:
        sentence_text: a single sentence string, e.g.
                       "Our EBITDA margins improved 200 basis points this quarter."

    What comes out:
        A string — one of: "revenue", "margins", "guidance",
                           "competition", "macro", "general"

        "general" means no aspect keywords matched. These sentences are
        still stored in Firestore but are excluded from aspect breakdown
        panels and the key quotes feature.

    How it works:
        1. Lowercase the sentence so matching is case-insensitive.
        2. For each aspect, count how many of its keywords appear in the text.
        3. Return the aspect with the highest keyword count.
        4. If all counts are zero, return "general".

    Why count all keyword hits rather than stopping at the first match:
        A sentence like "Our revenue growth was driven by strong macro demand"
        contains both revenue keywords ("revenue", "growth") and macro keywords
        ("macro", "demand"). Counting hits per aspect and taking the maximum
        picks the dominant topic rather than whichever keyword appears first.

    Edge case — ties:
        If two aspects have the same keyword count, the one that appears
        first in ASPECT_KEYWORDS wins. The dictionary order in config.py
        is: revenue → margins → guidance → competition → macro.
        This priority order is intentional — revenue and margins are the
        most analytically important aspects.
    """
    lower = sentence_text.lower()

    # Count keyword hits for each aspect.
    # hits is a dict like {"revenue": 2, "margins": 0, "guidance": 1, ...}
    hits = {}
    for aspect, keywords in ASPECT_KEYWORDS.items():
        count = sum(1 for kw in keywords if kw in lower)
        hits[aspect] = count

    # Find the aspect with the maximum hit count.
    best_aspect = max(hits, key=lambda a: hits[a])
    best_count  = hits[best_aspect]

    # If nothing matched, label as general.
    if best_count == 0:
        return "general"

    return best_aspect


def classify_aspects_batch(scored_sentences: list[dict]) -> list[dict]:
    """
    Adds an "aspect" key to every sentence dict in the list.

    What goes in:
        scored_sentences: the list of dicts from finbert_scorer.score_sentences()
        Each dict has: text, sentiment, confidence, sentence_index

    What comes out:
        The same list with an "aspect" key added to every dict.
        e.g. {"text": "...", "sentiment": "positive",
               "confidence": 0.91, "sentence_index": 4, "aspect": "revenue"}

    Why mutate the dicts in place rather than returning new dicts:
        The sentence dicts are already built by finbert_scorer. Adding
        the aspect key directly avoids creating 300 new dict objects for
        a typical transcript. The pipeline passes the same list object
        through all stages — finbert_scorer builds it, aspect_classifier
        enriches it, firestore_writer reads it.
    """
    for sentence in scored_sentences:
        sentence["aspect"] = classify_aspect(sentence["text"])

    return scored_sentences


def get_aspect_summary(scored_sentences: list[dict]) -> dict:
    """
    Computes per-aspect sentiment aggregates across all sentences.

    What goes in:
        scored_sentences: the enriched list with both sentiment and aspect keys

    What comes out:
        A nested dict used to populate the aspect_scores field in Firestore.
        Structure:
        {
            "revenue":     {"score": 0.62, "positive": 14, "negative": 3,  "neutral": 8},
            "margins":     {"score": 0.41, "positive": 6,  "negative": 11, "neutral": 4},
            "guidance":    {"score": 0.55, "positive": 9,  "negative": 5,  "neutral": 7},
            "competition": {"score": 0.70, "positive": 12, "negative": 2,  "neutral": 5},
            "macro":       {"score": 0.48, "positive": 7,  "negative": 8,  "neutral": 6},
        }

    How the score is computed:
        score = (positive_count - negative_count) / total_sentences_for_aspect
        Then normalized to a 0.0–1.0 range by mapping from [-1, 1] to [0, 1].
        Formula: normalized = (raw_score + 1) / 2

        A score of 1.0 means every sentence for that aspect was positive.
        A score of 0.5 means equal positive and negative.
        A score of 0.0 means every sentence was negative.

    Why this formula over averaging confidence scores:
        Confidence scores measure how certain FinBERT is, not how positive
        the overall tone is. A sentence with 0.95 confidence negative is
        worse than a sentence with 0.60 confidence negative — but averaging
        confidences would treat the 0.95 as "more extreme" regardless of
        direction. The positive-minus-negative formula directly captures
        the net sentiment direction.
    """
    aspects = list(ASPECT_KEYWORDS.keys())

    # Initialise counters for each aspect
    summary = {
        aspect: {"positive": 0, "negative": 0, "neutral": 0, "total": 0}
        for aspect in aspects
    }

    for sentence in scored_sentences:
        aspect    = sentence.get("aspect", "general")
        sentiment = sentence.get("sentiment", "neutral")

        if aspect not in summary:
            continue  # skip "general" sentences

        summary[aspect][sentiment] += 1
        summary[aspect]["total"]   += 1

    # Compute normalized score for each aspect
    result = {}
    for aspect in aspects:
        counts   = summary[aspect]
        total    = counts["total"]

        if total == 0:
            # No sentences for this aspect — score defaults to neutral 0.5
            score = 0.5
        else:
            raw_score  = (counts["positive"] - counts["negative"]) / total
            score      = round((raw_score + 1) / 2, 4)

        result[aspect] = {
            "score":    score,
            "positive": counts["positive"],
            "negative": counts["negative"],
            "neutral":  counts["neutral"],
        }

    return result


def get_most_negative_sentences(
    scored_sentences: list[dict],
    aspect: str,
    top_n: int = 3
) -> list[dict]:
    """
    Returns the N most negative sentences for a given aspect.

    What goes in:
        scored_sentences: the enriched sentence list
        aspect: one of "revenue", "margins", "guidance", "competition", "macro"
        top_n: how many sentences to return (default 3)

    What comes out:
        A list of up to top_n sentence dicts, sorted by confidence descending
        among negative-sentiment sentences for the given aspect.
        These are displayed in the AspectPanel component below each aspect score.

    Why sort by confidence descending:
        Among all negative sentences for margins, the one with 0.94 confidence
        is the most definitively bearish language. Showing the highest-confidence
        negatives surfaces the clearest warning signals first.
    """
    negative_for_aspect = [
        s for s in scored_sentences
        if s.get("aspect") == aspect
        and s.get("sentiment") == "negative"
    ]

    # Sort by confidence descending — most certain negatives first
    negative_for_aspect.sort(key=lambda s: s.get("confidence", 0), reverse=True)

    return negative_for_aspect[:top_n]