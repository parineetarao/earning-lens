import firebase_admin
from firebase_admin import credentials, firestore
import os
from dotenv import load_dotenv

load_dotenv()

cred = credentials.Certificate(os.getenv('FIREBASE_CRED_PATH', './serviceAccountKey.json'))
firebase_admin.initialize_app(cred)
db = firestore.client()

print("Scanning for quarters with no sentences...\n")

empty = []

companies = db.collection('companies').stream()
for company_doc in companies:
    company_id = company_doc.id
    quarters = db.collection('companies').document(company_id).collection('quarters').stream()
    
    for quarter_doc in quarters:
        quarter_id = quarter_doc.id
        data = quarter_doc.to_dict()
        overall_score = data.get('overall_score')
        
        # Only check quarters that have a score (were processed)
        if not overall_score:
            continue
        
        # Count sentences in subcollection
        sentences = db.collection('companies').document(company_id)\
                      .collection('quarters').document(quarter_id)\
                      .collection('sentences').limit(1).stream()
        
        sentence_count = sum(1 for _ in sentences)
        
        if sentence_count == 0:
            status = data.get('status', 'unknown')
            print(f"EMPTY: {company_id:15} {quarter_id:12} score={overall_score:.2f}  status={status}")
            empty.append((company_id, quarter_id))

print(f"\nTotal quarters with no sentences: {len(empty)}")
print("\nRe-run commands:")
for company_id, quarter_id in empty:
    print(f"python pipeline.py --company {company_id} --quarter {quarter_id} --force")