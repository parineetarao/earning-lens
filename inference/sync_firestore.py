# inference/sync_firestore.py
import firebase_admin
from firebase_admin import credentials, firestore
import os
from dotenv import load_dotenv

load_dotenv()
cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)
db   = firestore.client()

# ── Remove companies with insufficient quarters ───────────────────────────────

REMOVE = {
    "JSWSTEEL":   "steel",
    "TATASTEEL":  "steel",
    "TATAMOTORS": "auto",
}

print("=== Removing insufficient companies ===")
for ticker, sector in REMOVE.items():
    db.collection("companies").document(ticker).delete()
    ref     = db.collection("sectors").document(sector)
    doc     = ref.get()
    if doc.exists:
        current = doc.to_dict().get("companies", [])
        updated = [c for c in current if c != ticker]
        ref.update({"companies": updated})
    print(f"  ✗ Removed {ticker} from companies and {sector}")

    # Delete their PDFs
    folder = "transcripts"
    for f in os.listdir(folder):
        if f.startswith(f"{ticker}_"):
            os.remove(os.path.join(folder, f))
            print(f"    Deleted {f}")

# ── Re-add ADANIGREEN ─────────────────────────────────────────────────────────

print("\n=== Re-adding ADANIGREEN ===")
db.collection("companies").document("ADANIGREEN").set({
    "name":     "Adani Green Energy Limited",
    "ticker":   "ADANIGREEN",
    "sector":   "energy",
    "nse_code": "ADANIGREEN",
})
print("  ✓ Added companies/ADANIGREEN")

energy_ref = db.collection("sectors").document("energy")
energy_doc = energy_ref.get().to_dict()
companies  = energy_doc.get("companies", [])
if "ADANIGREEN" not in companies:
    companies.append("ADANIGREEN")
    energy_ref.update({"companies": companies})
print(f"  ✓ Updated energy sector → {companies}")

# ── Sync all sector arrays to match transcript files ─────────────────────────

print("\n=== Final Firestore sector state ===")

FINAL_SECTORS = {
    "steel":       ["SAIL", "JINDALSTEL", "NMDC", "HINDALCO"],
    "banking":     ["HDFCBANK", "ICICIBANK", "SBIN"],
    "it_services": ["TCS", "WIPRO", "HCLTECH", "TECHM", "LTIM"],
    "fmcg":        ["HINDUNILVR", "BRITANNIA", "DABUR", "MARICO", "NESTLEIND"],
    "auto":        ["BAJAJAUTO", "HEROMOTOCO", "EICHERMOT", "MM"],
    "pharma":      ["SUNPHARMA", "DRREDDY", "CIPLA", "DIVISLAB", "AUROPHARMA"],
    "cement":      ["ULTRACEMCO", "AMBUJACEM", "SHREECEM", "ACCLTD"],
    "energy":      ["RELIANCE", "POWERGRID", "NTPC", "TATAPOWER", "ADANIGREEN"],
}

for sector_id, companies in FINAL_SECTORS.items():
    db.collection("sectors").document(sector_id).update({
        "companies": companies
    })
    print(f"  ✓ {sector_id:<12} → {companies}")

# ── Final count ───────────────────────────────────────────────────────────────

print("\n=== Final transcript count ===")
folder  = "transcripts"
files   = [f for f in os.listdir(folder) if f.endswith(".pdf")]
print(f"  Total PDFs: {len(files)}")

from collections import defaultdict
company_quarters = defaultdict(list)
for f in sorted(files):
    parts = os.path.splitext(f)[0].split("_", 1)
    if len(parts) == 2:
        company_quarters[parts[0]].append(parts[1])

print(f"  Total companies: {len(company_quarters)}")
print(f"  Companies: {sorted(company_quarters.keys())}")

print("\nSync complete — Firestore matches transcript folder.")