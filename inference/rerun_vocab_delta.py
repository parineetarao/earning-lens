import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv
import os
from vocab_tracker import compute_vocab_delta
from text_extractor import extract_text_and_paragraphs

load_dotenv()
cred = credentials.Certificate('./serviceAccountKey.json')
firebase_admin.initialize_app(cred)
db = firestore.client()

QUARTERS = [
    'Q1_FY24','Q2_FY24','Q3_FY24','Q4_FY24',
    'Q1_FY25','Q2_FY25','Q3_FY25','Q4_FY25'
]

QUARTER_ORDER = {q: i for i, q in enumerate(QUARTERS)}

companies = [doc.id for doc in db.collection('companies').stream()]
print(f"Found {len(companies)} companies\n")

for company in sorted(companies):
    print(f"Processing {company}...")
    
    for i, quarter in enumerate(QUARTERS):
        pdf_path = f"transcripts/{company}_{quarter}.pdf"
        
        if not os.path.exists(pdf_path):
            print(f"  {quarter}: no PDF — skipping")
            continue
        
        # Get prior quarter text
        prior_text = ""
        if i > 0:
            prior_quarter = QUARTERS[i - 1]
            prior_pdf = f"transcripts/{company}_{prior_quarter}.pdf"
            if os.path.exists(prior_pdf):
                try:
                    prior_full_text, _ = extract_text_and_paragraphs(prior_pdf)
                    prior_text = prior_full_text
                except Exception as e:
                    print(f"  {quarter}: could not read prior PDF — {e}")
        
        # Get current quarter text
        try:
            current_full_text, _ = extract_text_and_paragraphs(pdf_path)
        except Exception as e:
            print(f"  {quarter}: could not read PDF — {e}")
            continue
        
        # Compute vocab delta
        try:
            vocab_delta = compute_vocab_delta(
                current_text=current_full_text,
                prior_text=prior_text if prior_text else current_full_text,
                top_n=15
            )
        except Exception as e:
            print(f"  {quarter}: vocab delta error — {e}")
            continue
        
        # Update only the vocab_delta field in Firestore
        try:
            quarter_ref = db.collection('companies').document(company)\
                           .collection('quarters').document(quarter)
            
            if quarter_ref.get().exists:
                quarter_ref.update({'vocab_delta': vocab_delta})
                increased = len(vocab_delta.get('increased', []))
                decreased = len(vocab_delta.get('decreased', []))
                print(f"  {quarter}: updated — {increased} increased, {decreased} decreased")
            else:
                print(f"  {quarter}: no Firestore document — skipping")
        except Exception as e:
            print(f"  {quarter}: Firestore error — {e}")

print("\nVocab delta rerun complete.")