# inference/bse_scraper.py

import os
import time
import requests
from datetime import datetime

# ── Constants ─────────────────────────────────────────────────────────────────

TRANSCRIPTS_DIR = os.path.join(os.path.dirname(__file__), "transcripts")

COMPANY_BSE_CODES = {
    # Steel
    "SAIL":       "500113",
    "JINDALSTEL": "532286",
    "TATASTEEL":  "500470",
    "HINDALCO":   "500440",
    "JSWSTEEL":   "500228",

    # Banking
    "HDFCBANK":   "500180",
    "ICICIBANK":  "532174",
    "SBIN":       "500112",
    "INDUSINDBK": "532187",
    "AXISBANK":   "532215",
    "KOTAKBANK":  "500247",

    # IT Services
    "TCS":        "532540",
    "INFY":       "500209",
    "WIPRO":      "507685",
    "HCLTECH":    "532281",
    "TECHM":      "532755",
    "LTIM":       "540005",

    # FMCG
    "HINDUNILVR": "500696",
    "NESTLEIND":  "500790",
    "DABUR":      "500096",
    "BRITANNIA":  "500825",
    "GODREJCP":   "532424",
    "MARICO":     "531642",

    # Auto
    "BAJAJAUTO":  "532977",
    "HEROMOTOCO": "500182",
    "EICHERMOT":  "505200",
    "MM":         "500520",
    "MARUTI":     "532500",

    # Pharma
    "SUNPHARMA":  "524715",
    "DRREDDY":    "500124",
    "CIPLA":      "500087",
    "DIVISLAB":   "532488",
    "AUROPHARMA": "524804",

    # Cement
    "ULTRACEMCO": "532538",
    "AMBUJACEM":  "500425",
    "SHREECEM":   "500387",
    "ACCLTD":     "500410",
    "DALIMACEM":  "542216",

    # Energy
    "RELIANCE":   "500325",
    "TATAPOWER":  "500400",
    "TORNTPOWER": "532779",
    "ADANIGREEN": "541450",
    "NTPC":       "532555",
    "ONGC":         "500312",
}

# One API call per quarter — avoids the 50-record limit.
# Each entry is (quarter_label, from_date, to_date).
# Date ranges are generous — transcripts are filed 1–7 days after the call.
QUARTERS = [
    ("Q1_FY24", "20230401", "20230915"),
    ("Q2_FY24", "20230701", "20231215"),
    ("Q3_FY24", "20231001", "20240315"),
    ("Q4_FY24", "20240101", "20240715"),
    ("Q1_FY25", "20240401", "20240915"),
    ("Q2_FY25", "20240701", "20241215"),
    ("Q3_FY25", "20241001", "20250315"),
    ("Q4_FY25", "20250101", "20250715"),
]

HEADERS = {
    "User-Agent":       "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Referer":          "https://www.bseindia.com/",
    "Accept":           "application/json, text/plain, */*",
    "Accept-Language":  "en-US,en;q=0.9",
    "Origin":           "https://www.bseindia.com",
    "X-Requested-With": "XMLHttpRequest",
    "Connection":       "keep-alive",
}

# FIXED: added 1q/2q/3q/4q (BSE uses "3QFY25" not "Q3FY25")
# also added "earnings discussion" which Tata Steel uses
TRANSCRIPT_KEYWORDS = [
    "transcript of earnings",
    "earnings call transcript",
    "conference call transcript",
    "investor call transcript",
    "analyst call transcript",
    "earnings conference call",
    "transcript of analyst",
    "transcript of investor",
    "audio/video/transcript",
    "audio / video / transcript",
    "con-call transcript",
    "concall transcript",
    "earnings discussion",       # Tata Steel uses this
    "earnings call",             # broad catch
    "q1fy", "q2fy", "q3fy", "q4fy",   # e.g. "Q3FY25 Earnings"
    "1qfy", "2qfy", "3qfy", "4qfy",   # e.g. "3QFY2025 Earnings Discussion"
    "q1 fy", "q2 fy", "q3 fy", "q4 fy",  # spaced variants
    "transcript",                # catch-all for any "transcript" headline
]

EXCLUSION_KEYWORDS = [
    "agm",
    "annual general",
    "board meeting outcome",
    "postal ballot",
    "newspaper advertisement",
    "intimation of schedule",    # meeting schedule notices, not transcripts
    "intimation of closure",
    "credit rating",
    "allotment",
    "regulation 74",
    "trading window",
    "audio-video recording",        # ← new: notification letter
    "audio/video recording",        # ← new: notification letter
    "video recording of",           # ← new: notification letter
    "intimation of earnings",       # ← new: schedule notice
    "schedule of earnings",         # ← new: schedule notice
]

# FIXED: AttachHis instead of AttachLive
PDF_BASE_URL = "https://www.bseindia.com/xml-data/corpfiling/AttachHis/"

API_URL = "https://api.bseindia.com/BseIndiaAPI/api/AnnSubCategoryGetData/w"


# ── Transcript detection ──────────────────────────────────────────────────────

def is_transcript(headline: str) -> bool:
    """
    Returns True if an announcement headline looks like an earnings call transcript.
    Two-pass: must match an inclusion keyword AND must not match any exclusion keyword.
    """
    lower = headline.lower()
    if not any(kw in lower for kw in TRANSCRIPT_KEYWORDS):
        return False
    if any(kw in lower for kw in EXCLUSION_KEYWORDS):
        return False
    return True


# ── Date parsing ──────────────────────────────────────────────────────────────

def parse_bse_date(date_str: str) -> datetime | None:
    """
    Parses BSE date strings which come in multiple formats including
    milliseconds: "2025-02-04T21:01:42.377"

    Fix: strip everything after the decimal point before parsing.
    """
    if not date_str:
        return None

    # Strip milliseconds — "2025-02-04T21:01:42.377" → "2025-02-04T21:01:42"
    clean = date_str.split(".")[0].strip()

    formats = [
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%d %H:%M:%S",
        "%Y%m%d%H%M%S",
        "%Y%m%d",
        "%d/%m/%Y",
        "%Y-%m-%d",
    ]

    for fmt in formats:
        try:
            return datetime.strptime(clean[:len(fmt)], fmt)
        except ValueError:
            continue

    # Last resort: first 8 chars as YYYYMMDD
    try:
        digits = "".join(c for c in date_str if c.isdigit())[:8]
        return datetime.strptime(digits, "%Y%m%d")
    except ValueError:
        return None


# ── API fetching ──────────────────────────────────────────────────────────────

def fetch_announcements(bse_code: str, from_date: str, to_date: str) -> list[dict]:
    """
    Fetches BSE announcements for one company within a date range.
    No subcategory filter — we rely on keyword matching instead.
    """
    params = {
        "strCat":      "-1",
        "strPrevDate": from_date,
        "strScrip":    bse_code,
        "strSearch":   "P",
        "strToDate":   to_date,
        "strType":     "C",
    }

    try:
        response = requests.get(
            API_URL,
            params=params,
            headers=HEADERS,
            timeout=15
        )

        if response.status_code != 200:
            print(f"    ✗ BSE API returned {response.status_code}")
            return []

        data = response.json()
        return data.get("Table", [])

    except requests.exceptions.Timeout:
        print(f"    ✗ Request timed out")
        return []
    except (requests.exceptions.RequestException, ValueError) as e:
        print(f"    ✗ Request failed: {e}")
        return []


# ── PDF download ──────────────────────────────────────────────────────────────

def download_pdf(attachment_name: str, save_path: str) -> bool:
    """
    Downloads a PDF using the AttachHis path (confirmed working).
    """
    url = PDF_BASE_URL + attachment_name

    try:
        response = requests.get(
            url,
            headers=HEADERS,
            stream=True,
            timeout=30
        )

        if response.status_code != 200:
            return False

        content_type = response.headers.get("Content-Type", "")
        if "pdf" not in content_type.lower() and "octet-stream" not in content_type.lower():
            return False

        with open(save_path, "wb") as f:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)

        # A valid transcript PDF is always larger than 50KB
        if os.path.getsize(save_path) < 50 * 1024:
            os.remove(save_path)
            return False

        return True

    except requests.exceptions.RequestException:
        if os.path.exists(save_path):
            os.remove(save_path)
        return False


# ── Per-company orchestrator ──────────────────────────────────────────────────

def scrape_company(ticker: str, bse_code: str) -> dict:
    """
    For each quarter, makes a separate API call and downloads the transcript.
    One call per quarter avoids the 50-record API limit.
    """
    print(f"\n{ticker} (BSE: {bse_code})")

    downloaded   = 0
    skipped      = 0
    failed       = 0
    quarters_done = []

    for quarter_label, from_date, to_date in QUARTERS:

        # Skip if already downloaded from a previous run
        filename  = f"{ticker}_{quarter_label}.pdf"
        save_path = os.path.join(TRANSCRIPTS_DIR, filename)

        if os.path.exists(save_path):
            print(f"  ✓ {filename} already exists")
            quarters_done.append(quarter_label)
            skipped += 1
            continue

        # Fetch announcements for this specific quarter window
        announcements = fetch_announcements(bse_code, from_date, to_date)
        announcements.sort(
            key=lambda a: 0 if "transcript" in a.get("HEADLINE", "").lower() else 1
        )  # prioritize any headline containing "transcript"

        if not announcements:
            continue

        # Find the first transcript announcement in this quarter
        found = False
        for ann in announcements:
            headline   = ann.get("HEADLINE", "")
            attachment = ann.get("ATTACHMENTNAME", "")
            dt_tm      = ann.get("DT_TM", "") or ann.get("NEWS_DT", "")

            if not attachment or not attachment.lower().endswith(".pdf"):
                continue

            if not is_transcript(headline):
                continue

            # Download it
            print(f"  ↓ {filename}  [{headline[:55]}]")
            success = download_pdf(attachment, save_path)

            if success:
                size_kb = os.path.getsize(save_path) / 1024
                print(f"  ✓ {filename} ({size_kb:.0f} KB)")
                downloaded += 1
                quarters_done.append(quarter_label)
                found = True
                break
            else:
                print(f"  ✗ Download failed for {filename}")
                failed += 1
                # Try next announcement in case this one is corrupted
                continue

        if not found and not os.path.exists(save_path):
            # No transcript found for this quarter — not unusual for older quarters
            pass

        # Polite delay between quarter API calls
        time.sleep(0.5)

    return {
        "downloaded":  downloaded,
        "skipped":     skipped,
        "failed":      failed,
        "quarters":    sorted(quarters_done),
    }


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    os.makedirs(TRANSCRIPTS_DIR, exist_ok=True)

    print("=" * 60)
    print("EarningLens — BSE Transcript Scraper (fixed)")
    print(f"Quarters:  {len(QUARTERS)} ({QUARTERS[0][0]} → {QUARTERS[-1][0]})")
    print(f"Companies: {len(COMPANY_BSE_CODES)}")
    print(f"Saving to: {TRANSCRIPTS_DIR}")
    print("=" * 60)

    total_downloaded = 0
    total_skipped    = 0
    total_failed     = 0
    company_summary  = {}

    for ticker, bse_code in COMPANY_BSE_CODES.items():
        result = scrape_company(ticker, bse_code)
        total_downloaded += result["downloaded"]
        total_skipped    += result["skipped"]
        total_failed     += result["failed"]
        company_summary[ticker] = result
        time.sleep(1)  # polite delay between companies

    print("\n" + "=" * 60)
    print("SCRAPE COMPLETE")
    print("=" * 60)
    print(f"Downloaded: {total_downloaded}")
    print(f"Skipped:    {total_skipped}  (already existed)")
    print(f"Failed:     {total_failed}")

    print("\nPer-company:")
    for ticker, r in company_summary.items():
        quarters_str = ", ".join(r["quarters"]) if r["quarters"] else "none"
        print(f"  {ticker:<12} {r['downloaded']} downloaded | {quarters_str}")

    print("\nNeeds attention (< 4 quarters):")
    flagged = [t for t, r in company_summary.items() if len(r["quarters"]) < 4]
    if flagged:
        for t in flagged:
            print(f"  ⚠ {t}")
    else:
        print("  None")


if __name__ == "__main__":
    main()