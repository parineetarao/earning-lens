import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv
import os

load_dotenv()
cred = credentials.Certificate(os.getenv('FIREBASE_CRED_PATH', './serviceAccountKey.json'))
firebase_admin.initialize_app(cred)
db = firestore.client()

NEW_COMPANIES = [
    {
        'id': 'JSWSTEEL',
        'data': {
            'name': 'JSW Steel Limited',
            'ticker': 'JSWSTEEL',
            'sector': 'steel',
            'nse_code': 'JSWSTEEL',
        },
        'sector_id': 'steel',
    },
    {
        'id': 'MARUTI',
        'data': {
            'name': 'Maruti Suzuki India Limited',
            'ticker': 'MARUTI',
            'sector': 'auto',
            'nse_code': 'MARUTI',
        },
        'sector_id': 'auto',
    },
    {
        'id': 'DALMIACEM',
        'data': {
            'name': 'Dalmia Bharat Limited',
            'ticker': 'DALMIACEM',
            'sector': 'cement',
            'nse_code': 'DALMIACEM',
        },
        'sector_id': 'cement',
    },
    {
        'id': 'INDUSINDBK',
        'data': {
            'name': 'IndusInd Bank Limited',
            'ticker': 'INDUSINDBK',
            'sector': 'banking',
            'nse_code': 'INDUSINDBK',
        },
        'sector_id': 'banking',
    },
]

for company in NEW_COMPANIES:
    db.collection('companies').document(company['id']).set(company['data'])
    print(f"Added company: {company['id']}")

    sector_ref = db.collection('sectors').document(company['sector_id'])
    sector_doc = sector_ref.get()
    if sector_doc.exists:
        data = sector_doc.to_dict()
        companies = data.get('companies', [])
        if company['id'] not in companies:
            companies.append(company['id'])
            sector_ref.update({'companies': companies})
            print(f"  Added to sector: {company['sector_id']}")
    else:
        sector_ref.set({'name': company['sector_id'], 'companies': [company['id']]})
        print(f"  Created sector: {company['sector_id']}")

print('\nAll companies added.')