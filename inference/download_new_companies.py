# Save as inference/download_new_companies.py and run it

import requests
import os
import time
from datetime import datetime, timedelta

# BSE scraper configuration
# These are the BSE script codes for the new companies
BSE_CODES = {
    'JSWSTEEL': '500228',
    'BPCL': '500547',
}

QUARTERS = {
    'Q1_FY24': ('20230401', '20230630'),
    'Q2_FY24': ('20230701', '20230930'),
    'Q3_FY24': ('20231001', '20231231'),
    'Q4_FY24': ('20240101', '20240331'),
    'Q1_FY25': ('20240401', '20240630'),
    'Q2_FY25': ('20240701', '20240930'),
    'Q3_FY25': ('20241001', '20241231'),
    'Q4_FY25': ('20250101', '20250331'),
}

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json',
    'Referer': 'https://www.bseindia.com/',
}

def fetch_announcements(bse_code, from_date, to_date):
    url = (
        f'https://api.bseindia.com/BseIndiaAPI/api/AnnGetData/w'
        f'?strScrip={bse_code}'
        f'&strType=C'
        f'&strCategory=AGM%2FEGM%7CAnalyst%20%2F%20Investor%20Meet'
        f'&strFromDate={from_date}'
        f'&strToDate={to_date}'
        f'&strScrip={bse_code}'
    )
    try:
        r = requests.get(url, headers=HEADERS, timeout=15)
        r.raise_for_status()
        return r.json().get('Table', [])
    except Exception as e:
        print(f'  Error fetching: {e}')
        return []

def download_pdf(url, save_path):
    try:
        r = requests.get(url, headers=HEADERS, timeout=30, stream=True)
        r.raise_for_status()
        with open(save_path, 'wb') as f:
            for chunk in r.iter_content(chunk_size=8192):
                f.write(chunk)
        return True
    except Exception as e:
        print(f'  Download error: {e}')
        return False

os.makedirs('transcripts', exist_ok=True)

for company, bse_code in BSE_CODES.items():
    print(f'\n=== {company} (BSE: {bse_code}) ===')
    
    for quarter, (from_date, to_date) in QUARTERS.items():
        save_path = f'transcripts/{company}_{quarter}.pdf'
        
        if os.path.exists(save_path):
            print(f'  {quarter}: already exists, skipping')
            continue
        
        print(f'  {quarter}: searching BSE...')
        announcements = fetch_announcements(bse_code, from_date, to_date)
        
        # Filter for transcript-like announcements
        transcript_keywords = ['transcript', 'analyst', 'investor meet', 'earnings call', 'conference call']
        
        found = False
        for ann in announcements:
            headline = ann.get('HEADLINE', '').lower()
            attachment = ann.get('ATTACHMENTNAME', '')
            
            if any(kw in headline for kw in transcript_keywords) and attachment:
                pdf_url = f'https://www.bseindia.com/xml-data/corpfiling/AttachLive/{attachment}'
                print(f'    Found: {ann.get("HEADLINE", "")}')
                print(f'    Downloading...')
                
                if download_pdf(pdf_url, save_path):
                    print(f'    Saved: {save_path}')
                    found = True
                    break
        
        if not found:
            print(f'    No transcript found for {quarter}')
        
        time.sleep(1)  # Be respectful to BSE API

print('\nDownload complete.')
print('\nVerifying downloaded files:')
import fitz
for company in BSE_CODES:
    for quarter in QUARTERS:
        path = f'transcripts/{company}_{quarter}.pdf'
        if os.path.exists(path):
            doc = fitz.open(path)
            text = doc[0].get_text()[:80].replace('\n', ' ').strip()
            print(f'{company} {quarter}: {len(doc)} pages | {text[:60]}')
            doc.close()
        else:
            print(f'{company} {quarter}: NOT DOWNLOADED')