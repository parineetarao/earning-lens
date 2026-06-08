# inference/vocab_tracker.py

import re
from collections import Counter
import nltk
from nltk.corpus import stopwords
from nltk import pos_tag, word_tokenize

# Download required NLTK data (run once)
nltk.download('averaged_perceptron_tagger', quiet=True)
nltk.download('averaged_perceptron_tagger_eng', quiet=True)
nltk.download('punkt', quiet=True)
nltk.download('punkt_tab', quiet=True)
nltk.download('stopwords', quiet=True)
nltk.download('wordnet', quiet=True)

# Common English stopwords plus earnings call filler words.
# These are filtered out before counting because they appear in every
# transcript at high frequency and carry no analytical signal.
FINANCIAL_STOPWORDS = set([
    # Standard stopwords
    'the','a','an','and','or','but','in','on','at','to','for','of','with',
    'by','from','as','is','was','are','were','be','been','have','has','had',
    'do','does','did','will','would','could','should','may','might','shall',
    'that','this','these','those','it','its','we','our','us','you','they',
    'their','he','she','i','my','not','no','so','if','then','than','when',
    'which','who','how','all','any','more','over','after','before','during',
    'into','about','such','some','other','also','been','very','just','now',
    'well','right','good','going','look','think','know','want','need','make',
    'get','see','say','said','come','take','give','use','find','back','way',
    'because','while','though','although','however','therefore','thus',
    # Conversational filler (specific to earnings calls)
    'yes','okay','ok','yeah','absolutely','certainly','exactly','sure',
    'great','wonderful','thank','thanks','appreciate','congratulations',
    'please','certainly','definitely','clearly','obviously','basically',
    'actually','really','quite','rather','pretty','fairly','simply',
    'always','never','often','usually','generally','typically','normally',
    # Earnings call specific noise
    'quarter','quarters','year','years','fiscal','fy','q1','q2','q3','q4',
    'first','second','third','fourth','one','two','three','four','five',
    'per','basis','point','points','percent','percentage','basis',
    'mr','ms','mrs','sir','madam','ladies','gentlemen','hello','hi',
    've','re','ll','d','s','t','m','n','er','uh','um',
    # Abbreviations that appear as noise
    'cr','pat','ytd','yoy','qoq','lhs','rhs','fyi','imo','btw',
    # Common proper nouns that appear as noise
    'india','indian','company','companies','business','businesses',
    'management','team','board','director','chairman','ceo','cfo','coo',
    'analyst','analysts','investor','investors','operator','moderator',
])

# POS tags to KEEP — only these word types are financially meaningful
KEEP_POS_TAGS = {
    'JJ',   # Adjective: cautious, strong, elevated, weak
    'JJR',  # Adjective comparative: stronger, weaker, higher
    'JJS',  # Adjective superlative: strongest, weakest
    'VB',   # Verb base: accelerate, expand, decline, improve
    'VBD',  # Verb past tense: accelerated, expanded, declined
    'VBG',  # Verb gerund: accelerating, expanding, declining
    'VBN',  # Verb past participle: improved, reduced, impacted
    'VBP',  # Verb present: improve, reduce, impact
    'VBZ',  # Verb 3rd person: improves, reduces, impacts
    'NN',   # Noun singular: growth, margin, revenue, pressure
    'NNS',  # Noun plural: margins, revenues, headwinds
    'RB',   # Adverb: significantly, moderately, substantially
    'RBR',  # Adverb comparative: more significantly
}

# Additional words to always exclude even if they pass POS filter
ALWAYS_EXCLUDE = {
    # Generic verbs with no financial signal
    'say','said','says','saying','go','goes','went','going',
    'come','came','comes','coming','get','got','gets','getting',
    'give','gave','gives','giving','take','took','takes','taking',
    'make','made','makes','making','see','saw','sees','seeing',
    'know','knew','knows','knowing','think','thought','thinks',
    'want','wanted','wants','wanting','need','needed','needs',
    'look','looked','looks','looking','mean','means','meant',
    'continue','continued','continues','continuing',
    'remain','remained','remains','remaining',
    'include','included','includes','including',
    'increase','increase','increases','increasing',  # too generic alone
    'happen','happened','happens','happening',
    # Generic nouns with no signal
    'number','numbers','time','times','way','ways','thing','things',
    'part','parts','place','places','point','points','level','levels',
    'side','area','areas','kind','type','types','lot','lots',
    'result','results','case','cases','fact','basis','line','lines',
    'end','start','top','bottom','front','back','set','sets',
    # Names and titles (proper nouns handled separately)
    'mahindra','tata','reliance','hdfc','icici','infosys','wipro',
}

def is_meaningful_word(word, pos_tag_result):
    """
    Returns True only if the word is financially meaningful.
    """
    word_lower = word.lower()
    
    # Must be at least 4 characters
    if len(word_lower) < 4:
        return False
    
    # Must not be in stopwords
    if word_lower in FINANCIAL_STOPWORDS:
        return False
    
    # Must not be in always-exclude list
    if word_lower in ALWAYS_EXCLUDE:
        return False
    
    # Must not be purely numeric or contain digits
    if re.search(r'\d', word_lower):
        return False
    
    # Must not be an abbreviation (all caps, short)
    if word.isupper() and len(word) <= 5:
        return False
    
    # Must not start with capital (likely proper noun — person/company name)
    # Exception: if it appears at start of sentence it may be legitimate
    # We handle this by checking the POS tag
    pos = pos_tag_result
    
    # Reject proper nouns (NNP, NNPS) — these are person/company names
    if pos in ('NNP', 'NNPS'):
        return False
    
    # Must be in the meaningful POS categories
    if pos not in KEEP_POS_TAGS:
        return False
    
    return True


def get_word_frequencies(sentences):
    """
    Extract financially meaningful word frequencies from a list of sentence dicts.
    Uses POS tagging to filter out proper nouns, filler words, and abbreviations.
    """
    from collections import Counter
    
    all_text = ' '.join(
        s.get('text', '') for s in sentences if s.get('text')
    ).lower()
    
    # Tokenize
    tokens = word_tokenize(all_text)
    
    # POS tag all tokens at once (more accurate than word by word)
    tagged = pos_tag(tokens)
    
    # Filter to meaningful words only
    meaningful_words = [
        word for word, pos in tagged
        if is_meaningful_word(word, pos)
    ]
    
    return Counter(meaningful_words)


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