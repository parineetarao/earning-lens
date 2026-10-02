import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv
import os
import nltk

from vocab_tracker import compute_vocab_delta
from text_extractor import extract_text_and_paragraphs


# --------------------------------------------------
# Setup
# --------------------------------------------------

load_dotenv()

nltk.download('punkt')
nltk.download('punkt_tab')

cred = credentials.Certificate('./serviceAccountKey.json')
firebase_admin.initialize_app(cred)

db = firestore.client()


# --------------------------------------------------
# Quarter configuration
# --------------------------------------------------

QUARTERS = [
    'Q1_FY24',
    'Q2_FY24',
    'Q3_FY24',
    'Q4_FY24',
    'Q1_FY25',
    'Q2_FY25',
    'Q3_FY25',
    'Q4_FY25'
]


# --------------------------------------------------
# Get companies from Firestore
# --------------------------------------------------

companies = [doc.id for doc in db.collection('companies').stream()]

print(f"Found {len(companies)} companies\n")


# --------------------------------------------------
# Process every company and quarter
# --------------------------------------------------

for company in sorted(companies):

    print(f"Processing {company}...")

    for i, quarter in enumerate(QUARTERS):

        pdf_path = f"transcripts/{company}_{quarter}.pdf"

        # ------------------------------------------
        # Check current quarter PDF
        # ------------------------------------------

        if not os.path.exists(pdf_path):
            print(f"  {quarter}: no PDF — skipping")
            continue


        # ------------------------------------------
        # Get prior quarter sentences
        # ------------------------------------------

        prior_sentences = []

        if i > 0:

            prior_quarter = QUARTERS[i - 1]
            prior_pdf = f"transcripts/{company}_{prior_quarter}.pdf"

            if os.path.exists(prior_pdf):

                try:
                    prior_full_text, _ = extract_text_and_paragraphs(
                        prior_pdf
                    )

                    prior_sentences = [
                        {'text': sentence}
                        for sentence in nltk.sent_tokenize(
                            prior_full_text
                        )
                    ]

                except Exception as e:

                    print(
                        f"  {quarter}: "
                        f"could not read prior PDF — {e}"
                    )


        # ------------------------------------------
        # Get current quarter sentences
        # ------------------------------------------

        try:

            current_full_text, _ = extract_text_and_paragraphs(
                pdf_path
            )

            current_sentences = [
                {'text': sentence}
                for sentence in nltk.sent_tokenize(
                    current_full_text
                )
            ]

        except Exception as e:

            print(
                f"  {quarter}: "
                f"could not read PDF — {e}"
            )

            continue


        # ------------------------------------------
        # Compute vocabulary delta
        # ------------------------------------------

        try:

            vocab_delta = compute_vocab_delta(
                current_sentences=current_sentences,
                prior_sentences=(
                    prior_sentences
                    if prior_sentences
                    else current_sentences
                ),
                top_n=15
            )

        except Exception as e:

            print(
                f"  {quarter}: "
                f"vocab delta error — {e}"
            )

            continue


        # ------------------------------------------
        # Update Firestore
        # ------------------------------------------

        try:

            quarter_ref = (
                db.collection('companies')
                .document(company)
                .collection('quarters')
                .document(quarter)
            )

            if quarter_ref.get().exists:

                quarter_ref.update({
                    'vocab_delta': vocab_delta
                })

                increased = len(
                    vocab_delta.get('increased', [])
                )

                decreased = len(
                    vocab_delta.get('decreased', [])
                )

                print(
                    f"  {quarter}: updated — "
                    f"{increased} increased, "
                    f"{decreased} decreased"
                )

            else:

                print(
                    f"  {quarter}: "
                    f"no Firestore document — skipping"
                )

        except Exception as e:

            print(
                f"  {quarter}: "
                f"Firestore error — {e}"
            )


# --------------------------------------------------
# Finished
# --------------------------------------------------

print("\nVocab delta rerun complete.")