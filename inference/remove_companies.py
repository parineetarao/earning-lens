# Save as inference/remove_companies.py and run it

import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv
import os

load_dotenv()
cred = credentials.Certificate(os.getenv('FIREBASE_CRED_PATH', './serviceAccountKey.json'))
firebase_admin.initialize_app(cred)
db = firestore.client()

def delete_company(company_id):
    print(f'Deleting {company_id}...')
    
    # Delete all quarters and their sentences
    quarters_ref = db.collection('companies').document(company_id).collection('quarters')
    quarters = quarters_ref.stream()
    
    for quarter in quarters:
        # Delete all sentences in this quarter
        sentences_ref = quarters_ref.document(quarter.id).collection('sentences')
        sentences = sentences_ref.stream()
        
        batch = db.batch()
        batch_count = 0
        
        for sentence in sentences:
            batch.delete(sentence.reference)
            batch_count += 1
            if batch_count >= 499:
                batch.commit()
                batch = db.batch()
                batch_count = 0
        
        if batch_count > 0:
            batch.commit()
        
        # Delete the quarter document
        quarters_ref.document(quarter.id).delete()
        print(f'  Deleted {company_id}/{quarter.id}')
    
    # Delete the company document
    db.collection('companies').document(company_id).delete()
    print(f'  Deleted company document: {company_id}')

# Also remove from sectors collection
def remove_from_sector(company_id, sector_id):
    sector_ref = db.collection('sectors').document(sector_id)
    sector_doc = sector_ref.get()
    if sector_doc.exists:
        data = sector_doc.to_dict()
        companies = data.get('companies', [])
        if company_id in companies:
            companies.remove(company_id)
            sector_ref.update({'companies': companies})
            print(f'  Removed {company_id} from sector {sector_id}')

delete_company('BPCL')
delete_company('JSWSTEEL')
remove_from_sector('JSWSTEEL', 'steel')
remove_from_sector('BPCL', 'energy')

print('\nDone. NMDC and POWERGRID removed.')