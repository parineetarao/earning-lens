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


# ============================================================
# STOPWORDS
# ============================================================

# Common English stopwords plus earnings call filler words.
# These are filtered out before counting because they appear in
# every transcript at high frequency and carry little analytical signal.

STOPWORDS = set([
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

    # Conversational filler
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

    # Common proper nouns / generic corporate terms
    'india','indian','company','companies','business','businesses',
    'management','team','board','director','chairman','ceo','cfo','coo',
    'analyst','analysts','investor','investors','operator','moderator',

    # Month names
    'january','february','march','april','may','june',
    'july','august','september','october','november','december',

    # Number words
    'zero','one','two','three','four','five','six','seven',
    'eight','nine','ten','eleven','twelve','hundred','thousand',

    # More filler
    'okay','current','fiscal','now','because','level',
    'since','still','already','lot','much','many','every',
])


# ============================================================
# POS TAGS TO KEEP
# ============================================================

KEEP_POS_TAGS = {
    'JJ',   # Adjective
    'JJR',  # Comparative adjective
    'JJS',  # Superlative adjective

    'VB',   # Verb base
    'VBD',  # Past tense
    'VBG',  # Gerund
    'VBN',  # Past participle
    'VBP',  # Present tense
    'VBZ',  # 3rd person present

    'NN',   # Singular noun
    'NNS',  # Plural noun

    'RB',   # Adverb
    'RBR',  # Comparative adverb
}


# ============================================================
# ALWAYS EXCLUDE
# ============================================================

ALWAYS_EXCLUDE = {
    # Generic verbs
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
    'increase','increases','increasing',

    'happen','happened','happens','happening',

    # Generic nouns
    'number','numbers','time','times','way','ways',
    'thing','things','part','parts','place','places',
    'point','points','level','levels','side','area','areas',
    'kind','type','types','lot','lots',
    'result','results','case','cases','fact','basis',
    'line','lines','end','start','top','bottom','front',
    'back','set','sets',

    # Company names / generic names
    'mahindra','tata','reliance','hdfc','icici','infosys','wipro',

    # Generic words
    'current','level','requirement','requirements',
}


# ============================================================
# MEANINGFUL WORD FILTER
# ============================================================

def is_meaningful_word(word, pos_tag_result):
    """
    Returns True only if the word is considered financially meaningful.
    """

    word_lower = word.lower()

    # Minimum length
    if len(word_lower) < 4:
        return False

    # Stopwords
    if word_lower in STOPWORDS:
        return False

    # Always-excluded words
    if word_lower in ALWAYS_EXCLUDE:
        return False

    # Numbers / words containing digits
    if re.search(r'\d', word_lower):
        return False

    # Short all-caps abbreviations
    if word.isupper() and len(word) <= 5:
        return False

    # Proper nouns
    pos = pos_tag_result

    if pos in ('NNP', 'NNPS'):
        return False

    # Only retain meaningful POS categories
    if pos not in KEEP_POS_TAGS:
        return False

    return True


# ============================================================
# WORD FREQUENCY
# ============================================================

def get_word_frequencies(sentences):
    """
    Extract financially meaningful word frequencies from a list
    of sentence dictionaries.

    Each sentence dictionary should contain:
        {"text": "..."}
    """

    all_text = ' '.join(
        s.get('text', '')
        for s in sentences
        if s.get('text')
    ).lower()

    # Tokenize
    tokens = word_tokenize(all_text)

    # POS tag all tokens
    tagged = pos_tag(tokens)

    # Filter meaningful words
    meaningful_words = [
        word
        for word, pos in tagged
        if is_meaningful_word(word, pos)
    ]

    return Counter(meaningful_words)


# ============================================================
# LEGACY TOKENIZER
# ============================================================

def tokenize(text: str) -> list[str]:
    """
    Converts raw transcript text into lowercase alphabetic tokens
    with STOPWORDS removed.

    This function is retained for compatibility with older code.
    Vocabulary Delta now uses get_word_frequencies() instead.
    """

    tokens = re.findall(
        r"[a-zA-Z]{2,}",
        text.lower()
    )

    tokens = [
        t for t in tokens
        if t not in STOPWORDS
    ]

    return tokens


# ============================================================
# LEGACY WORD COUNTER
# ============================================================

def count_words(text: str) -> Counter:
    """
    Returns a word-frequency Counter.

    Retained for compatibility with older code.
    Vocabulary Delta now uses get_word_frequencies().
    """

    tokens = tokenize(text)

    return Counter(tokens)


# ============================================================
# VOCABULARY DELTA
# ============================================================

def compute_vocab_delta(
    current_sentences: list[dict],
    prior_sentences: list[dict],
    top_n: int = 15
) -> dict:
    """
    Computes which meaningful words increased and decreased
    between two quarters.

    Parameters:
        current_sentences:
            Sentence dictionaries from the current quarter.

        prior_sentences:
            Sentence dictionaries from the previous quarter.

        top_n:
            Number of words to return in each direction.

    Returns:
        {
            "increased": [
                {
                    "word": "headwinds",
                    "current": 11,
                    "prior": 2,
                    "delta": 9
                }
            ],
            "decreased": [
                {
                    "word": "confident",
                    "current": 1,
                    "prior": 9,
                    "delta": -8
                }
            ]
        }

    Processing:
        1. Extract meaningful words from both quarters.
        2. Count their frequencies.
        3. Calculate absolute frequency differences.
        4. Remove words appearing fewer than twice in total.
        5. Return the largest increases and decreases.
    """

    # Get filtered word frequencies
    current_counts = get_word_frequencies(
        current_sentences
    )

    prior_counts = get_word_frequencies(
        prior_sentences
    )

    # All unique words across both quarters
    all_words = (
        set(current_counts.keys())
        |
        set(prior_counts.keys())
    )

    deltas = []

    for word in all_words:

        current = current_counts.get(
            word,
            0
        )

        prior = prior_counts.get(
            word,
            0
        )

        total = current + prior

        # Ignore words occurring only once in total
        if total < 2:
            continue

        delta = current - prior

        # Ignore words whose frequency did not change
        if delta == 0:
            continue

        deltas.append({
            "word": word,
            "current": current,
            "prior": prior,
            "delta": delta,
        })

    # --------------------------------------------------------
    # Increased words
    # --------------------------------------------------------

    increased = sorted(
        [
            d
            for d in deltas
            if d["delta"] > 0
        ],
        key=lambda x: x["delta"],
        reverse=True
    )[:top_n]

    # --------------------------------------------------------
    # Decreased words
    # --------------------------------------------------------

    decreased = sorted(
        [
            d
            for d in deltas
            if d["delta"] < 0
        ],
        key=lambda x: x["delta"]
    )[:top_n]

    return {
        "increased": increased,
        "decreased": decreased,
    }


# ============================================================
# KEY QUOTES
# ============================================================

def extract_key_quotes(
    scored_sentences: list[dict],
    aspect: str,
    top_n: int = 3
) -> list[dict]:
    """
    Extracts the strongest negative sentences for a given aspect.
    """

    aspect_sentences = [
        s
        for s in scored_sentences
        if s.get("aspect") == aspect
        and s.get("sentiment") == "negative"
    ]

    aspect_sentences.sort(
        key=lambda s: s.get(
            "confidence",
            0
        ),
        reverse=True
    )

    return aspect_sentences[:top_n]