# inference/config.py

import os
from dotenv import load_dotenv

# Load the .env file from the same directory as this file.
# This makes the script work regardless of which directory you run it from.
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

# ── Firebase ──────────────────────────────────────────────────────────────────

# Path to your service account key JSON file.
# os.path.dirname(__file__) gives the absolute path to the inference/ folder,
# so this always resolves correctly no matter where you call pipeline.py from.
FIREBASE_CRED_PATH = os.path.join(
    os.path.dirname(__file__),
    os.getenv("FIREBASE_CRED_PATH", "serviceAccountKey.json")
)

FIREBASE_PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID", "earninglens-ce8dd")

# The Realtime DB URL — required separately from the project ID.
FIREBASE_DATABASE_URL = os.getenv(
    "FIREBASE_DATABASE_URL",
    "https://earninglens-ce8dd-default-rtdb.firebaseio.com"
)

# ── Firestore collection names ────────────────────────────────────────────────

# Keeping collection names as constants means a typo like "compnies" is caught
# at import time (NameError) rather than silently writing to a wrong collection.
COLLECTION_COMPANIES = "companies"
COLLECTION_SECTORS = "sectors"

# ── FinBERT ───────────────────────────────────────────────────────────────────

# The HuggingFace model ID for FinBERT pretrained on financial sentiment.
# This downloads ~400MB on first run and caches in inference/models/.
FINBERT_MODEL_NAME = "yiyanghkust/finbert-tone"

# Where HuggingFace caches the downloaded model weights.
# Setting this explicitly keeps the cache inside the project folder,
# not scattered in your home directory's .cache folder.
FINBERT_CACHE_DIR = os.path.join(os.path.dirname(__file__), "models")

# Sentences shorter than this word count are skipped.
# "Thank you." and "Operator: Next question." are noise, not sentiment signals.
MIN_SENTENCE_WORDS = 6

# ── Aspect classifier ─────────────────────────────────────────────────────────

# Each aspect maps to a list of keywords. The classifier counts keyword hits
# per sentence and assigns the aspect with the highest count.
# If no keywords match, the sentence is tagged as "general".
ASPECT_KEYWORDS = {
    "revenue": [
        "revenue", "sales", "volume", "topline", "top-line", "growth",
        "demand", "realisation", "realization", "shipment", "dispatch",
        "order", "backlog", "bookings", "market share"
    ],
    "margins": [
        "margin", "ebitda", "profitability", "cost", "expense", "operating",
        "gross profit", "spread", "efficiency", "overhead", "raw material",
        "coking coal", "input cost", "pricing power", "leverage"
    ],
    "guidance": [
        "guidance", "outlook", "expect", "anticipate", "forecast", "target",
        "next quarter", "next year", "fy25", "fy26", "going forward",
        "confident", "cautious", "visibility", "pipeline", "plan", "intend"
    ],
    "competition": [
        "competition", "competitor", "market share", "pricing", "import",
        "china", "domestic", "peer", "industry", "sector", "player",
        "differentiat", "substitute", "tariff", "dumping"
    ],
    "macro": [
        "macro", "economy", "gdp", "inflation", "interest rate", "rbi",
        "government", "policy", "infrastructure", "capex", "investment",
        "geopolit", "global", "commodity", "cycle", "monsoon", "election"
    ]
}

# ── Q&A boundary detection ────────────────────────────────────────────────────

# Phrases that typically mark the start of the analyst Q&A session.
# The splitter scans each paragraph for any of these strings (case-insensitive).
QA_BOUNDARY_PHRASES = [
    "we will now begin the question",
    "we will now open the floor",
    "open for questions",
    "we'll now take questions",
    "operator: ladies and gentlemen",
    "we'll now open for q&a",
    "now open for questions",
    "move to the q&a",
    "begin with the q&a",
    "first question comes from",
    "first question is from",
]

# ── GEMINI ───────────────────────────────────────────────────────────────────────

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# The model used for analyst brief generation.
# gemini-1.5-flash is fast and cheap for a structured summarisation task.
# One brief per transcript = negligible cost.
GEMINI_MODEL = "gemini-1.5-flash-8b"

# ── Groq ─────────────────────────────────────────────────────────────────────
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL   = "llama-3.1-8b-instant"

# ── Guidance drift alert ──────────────────────────────────────────────────────

# If guidance aspect sentiment drops more than this amount quarter-over-quarter,
# the GuidanceDriftBadge fires on the frontend.
GUIDANCE_DRIFT_THRESHOLD = 0.20