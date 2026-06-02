# inference/seed_firestore.py
# Run once to populate companies and sectors collections.
# Safe to re-run — uses set() with merge so existing documents are not overwritten.

import firebase_admin
from firebase_admin import credentials, firestore
import os
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

cred = credentials.Certificate(
    os.path.join(os.path.dirname(__file__), "serviceAccountKey.json")
)
firebase_admin.initialize_app(cred)
db = firestore.client()

# ── Company data ──────────────────────────────────────────────────────────────

COMPANIES = [
    # Steel
    ("TATASTEEL",  "Tata Steel Limited",             "steel"),
    ("JSWSTEEL",   "JSW Steel Limited",               "steel"),
    ("SAIL",       "Steel Authority of India",         "steel"),
    ("JINDALSTEL", "Jindal Steel and Power",           "steel"),
    ("NMDC",       "NMDC Limited",                    "steel"),
    # Banking
    ("HDFCBANK",   "HDFC Bank Limited",               "banking"),
    ("ICICIBANK",  "ICICI Bank Limited",              "banking"),
    ("AXISBANK",   "Axis Bank Limited",               "banking"),
    ("SBIN",       "State Bank of India",             "banking"),
    ("KOTAKBANK",  "Kotak Mahindra Bank",             "banking"),
    ("INDUSINDBK", "IndusInd Bank Limited",           "banking"),
    # IT Services
    ("TCS",        "Tata Consultancy Services",       "it_services"),
    ("INFY",       "Infosys Limited",                 "it_services"),
    ("WIPRO",      "Wipro Limited",                   "it_services"),
    ("HCLTECH",    "HCL Technologies",                "it_services"),
    ("TECHM",      "Tech Mahindra Limited",           "it_services"),
    ("LTIM",       "LTIMindtree Limited",             "it_services"),
    # FMCG
    ("HINDUNILVR", "Hindustan Unilever Limited",      "fmcg"),
    ("NESTLEIND",  "Nestle India Limited",            "fmcg"),
    ("DABUR",      "Dabur India Limited",             "fmcg"),
    ("BRITANNIA",  "Britannia Industries",            "fmcg"),
    ("GODREJCP",   "Godrej Consumer Products",        "fmcg"),
    ("MARICO",     "Marico Limited",                  "fmcg"),
    # Auto
    ("MARUTI",     "Maruti Suzuki India",             "auto"),
    ("TATAMOTORS", "Tata Motors Limited",             "auto"),
    ("BAJAJAUTO",  "Bajaj Auto Limited",              "auto"),
    ("HEROMOTOCO", "Hero MotoCorp Limited",           "auto"),
    ("EICHERMOT",  "Eicher Motors Limited",           "auto"),
    ("MM",         "Mahindra and Mahindra",           "auto"),
    # Pharma
    ("SUNPHARMA",  "Sun Pharmaceutical Industries",   "pharma"),
    ("DRREDDY",    "Dr Reddys Laboratories",          "pharma"),
    ("CIPLA",      "Cipla Limited",                   "pharma"),
    ("DIVISLAB",   "Divis Laboratories",              "pharma"),
    ("AUROPHARMA", "Aurobindo Pharma",                "pharma"),
    # Cement
    ("ULTRACEMCO", "UltraTech Cement",                "cement"),
    ("AMBUJACEM",  "Ambuja Cements",                  "cement"),
    ("SHREECEM",   "Shree Cement",                    "cement"),
    ("ACCLTD",     "ACC Limited",                     "cement"),
    # Energy
    ("RELIANCE",   "Reliance Industries",             "energy"),
    ("ONGC",       "Oil and Natural Gas Corporation", "energy"),
    ("POWERGRID",  "Power Grid Corporation",          "energy"),
    ("NTPC",       "NTPC Limited",                    "energy"),
]

# ── Sector data ───────────────────────────────────────────────────────────────

SECTORS = {
    "steel":       ("Steel",       ["TATASTEEL","JSWSTEEL","SAIL","JINDALSTEL","NMDC"]),
    "banking":     ("Banking",     ["HDFCBANK","ICICIBANK","AXISBANK","SBIN","KOTAKBANK","INDUSINDBK"]),
    "it_services": ("IT Services", ["TCS","INFY","WIPRO","HCLTECH","TECHM","LTIM"]),
    "fmcg":        ("FMCG",        ["HINDUNILVR","NESTLEIND","DABUR","BRITANNIA","GODREJCP","MARICO"]),
    "auto":        ("Auto",        ["MARUTI","TATAMOTORS","BAJAJAUTO","HEROMOTOCO","EICHERMOT","MM"]),
    "pharma":      ("Pharma",      ["SUNPHARMA","DRREDDY","CIPLA","DIVISLAB","AUROPHARMA"]),
    "cement":      ("Cement",      ["ULTRACEMCO","AMBUJACEM","SHREECEM","ACCLTD"]),
    "energy":      ("Energy",      ["RELIANCE","ONGC","POWERGRID","NTPC"]),
}


def seed_companies():
    print("Seeding companies collection...")
    for ticker, name, sector in COMPANIES:
        db.collection("companies").document(ticker).set({
            "name":     name,
            "ticker":   ticker,
            "sector":   sector,
            "nse_code": ticker,
        }, merge=True)
        print(f"  ✓ {ticker}")
    print(f"Done — {len(COMPANIES)} companies written\n")


def seed_sectors():
    print("Seeding sectors collection...")
    for sector_id, (name, companies) in SECTORS.items():
        db.collection("sectors").document(sector_id).set({
            "name":      name,
            "companies": companies,
        }, merge=True)
        print(f"  ✓ {sector_id} ({len(companies)} companies)")
    print(f"Done — {len(SECTORS)} sectors written\n")


if __name__ == "__main__":
    seed_companies()
    seed_sectors()
    print("Firestore seeding complete.")