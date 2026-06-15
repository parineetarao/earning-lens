# Save as inference/check_bse_api.py
import requests

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://www.bseindia.com/',
    'Origin': 'https://www.bseindia.com',
}

# Test with JSWSTEEL
bse_code = '500228'
url = f'https://api.bseindia.com/BseIndiaAPI/api/AnnGetData/w?strScrip={bse_code}&strType=C&strCategory=Analyst%20%2F%20Investor%20Meet&strFromDate=20230401&strToDate=20230630'

print(f'URL: {url}')
print()

r = requests.get(url, headers=HEADERS, timeout=15)
print(f'Status: {r.status_code}')
print(f'Content-Type: {r.headers.get("Content-Type")}')
print(f'Response (first 500 chars):')
print(r.text[:500])