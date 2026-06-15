# Save as inference/add_banking.py

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
        'id': 'AXISBANK',
        'data': {
            'name': 'Axis Bank Limited',
            'ticker': 'AXISBANK',
            'sector': 'banking',
            'nse_code': 'AXISBANK',
        },
    },
]

for company in NEW_COMPANIES:
    db.collection('companies').document(company['id']).set(company['data'])
    print(f"Added: {company['id']}")

    sector_ref = db.collection('sectors').document('banking')
    sector_doc = sector_ref.get()
    if sector_doc.exists:
        data = sector_doc.to_dict()
        companies = data.get('companies', [])
        if company['id'] not in companies:
            companies.append(company['id'])
            sector_ref.update({'companies': companies})
            print(f"  Added to banking sector")

print('Done.')