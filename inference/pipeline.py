# inference/pipeline.py

import os
import sys
import argparse
import time
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

# ── Local imports ─────────────────────────────────────────────────────────────
from config import COLLECTION_COMPANIES
from text_extractor import extract_text_and_paragraphs, get_page_count
from finbert_scorer import load_finbert, score_sentences
from aspect_classifier import classify_aspects_batch, get_aspect_summary
from qa_splitter import split_transcript, compute_split_scores
from vocab_tracker import compute_vocab_delta, extract_key_quotes
from firestore_writer import (
    init_firebase,
    compute_overall_score,
    write_quarter,
    write_sentences,
)
from realtime_updater import (
    set_status_running,
    update_progress,
    set_status_complete,
    set_status_error,
)
from analyst_brief import generate_brief
from peer_scorer import update_peer_scores_for_sector


# ── Helpers ───────────────────────────────────────────────────────────────────

def parse_filename(pdf_path: str) -> tuple[str, str]:
    """
    Extracts company_id and quarter_id from the PDF filename.

    What goes in:
        pdf_path: e.g. "transcripts/TATASTEEL_Q3_FY25.pdf"

    What comes out:
        ("TATASTEEL", "Q3_FY25")

    Why parse from filename rather than requiring CLI args:
        In batch mode, the pipeline processes every PDF in the transcripts
        folder automatically. Parsing the filename means you do not need
        to pass company and quarter for each file — they are encoded in
        the filename by the scraper.
    """
    basename = os.path.basename(pdf_path)           # TATASTEEL_Q3_FY25.pdf
    name     = os.path.splitext(basename)[0]        # TATASTEEL_Q3_FY25
    parts    = name.split("_", 1)                   # ["TATASTEEL", "Q3_FY25"]

    if len(parts) != 2:
        raise ValueError(
            f"Filename '{basename}' does not match expected format "
            f"COMPANYID_QUARTERID.pdf (e.g. TATASTEEL_Q3_FY25.pdf)"
        )

    return parts[0], parts[1]


def get_company_info(db, company_id: str) -> dict:
    """
    Reads company metadata from Firestore.

    What goes in:
        db:         Firestore client
        company_id: e.g. "TATASTEEL"

    What comes out:
        Dict with name, sector, ticker fields.
        Returns defaults if document does not exist.
    """
    doc = (
        db.collection(COLLECTION_COMPANIES)
          .document(company_id)
          .get()
    )

    if doc.exists:
        return doc.to_dict()

    # Fallback if company document missing from Firestore
    return {
        "name":   company_id,
        "sector": "unknown",
        "ticker": company_id,
    }


def get_prior_quarter_data(
    db:         object,
    company_id: str,
    quarter_id: str,
) -> tuple[dict | None, str | None]:
    """
    Fetches the prior quarter's overall scores and full text for vocab delta.

    What goes in:
        db:         Firestore client
        company_id: e.g. "TATASTEEL"
        quarter_id: e.g. "Q3_FY25"

    What comes out:
        (prior_overall_dict, prior_quarter_id)
        Both are None if no prior quarter exists in Firestore.

    Why we need prior data:
        1. overall dict   → used by analyst_brief for QoQ comparison
        2. quarter_id     → used to find the prior transcript PDF for
                            vocab delta computation
    """
    quarter_map = {
        "Q1": ("Q4", -1),
        "Q2": ("Q1",  0),
        "Q3": ("Q2",  0),
        "Q4": ("Q3",  0),
    }

    try:
        parts          = quarter_id.split("_")
        q, fy          = parts[0], parts[1]
        fy_num         = int(fy[2:])
        prior_q, offset = quarter_map[q]
        prior_fy       = f"FY{fy_num + offset:02d}"
        prior_qid      = f"{prior_q}_{prior_fy}"
    except (IndexError, KeyError, ValueError):
        return None, None

    prior_doc = (
        db.collection(COLLECTION_COMPANIES)
          .document(company_id)
          .collection("quarters")
          .document(prior_qid)
          .get()
    )

    if not prior_doc.exists:
        return None, None

    prior_data = prior_doc.to_dict()
    prior_overall = {
        "overall_score":   prior_data.get("overall_score", 0.5),
        "total_sentences": prior_data.get("total_sentences", 0),
        "positive_count":  prior_data.get("positive_count", 0),
        "negative_count":  prior_data.get("negative_count", 0),
        "neutral_count":   prior_data.get("neutral_count",  0),
    }

    return prior_overall, prior_qid


def get_prior_transcript_text(
    company_id:      str,
    prior_quarter_id: str,
) -> str:
    """
    Reads the prior quarter's transcript PDF text for vocab delta.

    What goes in:
        company_id:       e.g. "TATASTEEL"
        prior_quarter_id: e.g. "Q2_FY25"

    What comes out:
        Full text string of the prior transcript, or empty string
        if the PDF does not exist locally.

    Why read from local PDF rather than Firestore:
        Storing full transcript text in Firestore would be expensive
        and slow to read. The raw PDF is already on disk from the
        scraper. We extract text from it again for the vocab comparison.
        This costs ~0.5 seconds and zero Firestore reads.
    """
    transcripts_dir = os.path.join(os.path.dirname(__file__), "transcripts")
    prior_pdf       = os.path.join(
        transcripts_dir,
        f"{company_id}_{prior_quarter_id}.pdf"
    )

    if not os.path.exists(prior_pdf):
        return ""

    full_text, _ = extract_text_and_paragraphs(prior_pdf)
    return full_text


# ── Core pipeline ─────────────────────────────────────────────────────────────

def process_transcript(
    pdf_path:   str,
    tokenizer:  object,
    model:      object,
    db:         object,
    force:      bool = False,
) -> bool:
    """
    Full pipeline for one transcript PDF.

    What goes in:
        pdf_path:  absolute path to the PDF file
        tokenizer: FinBERT tokenizer from load_finbert()
        model:     FinBERT model from load_finbert()
        db:        Firestore client
        force:     if True, reprocess even if already in Firestore

    What comes out:
        True if processing succeeded, False if it failed or was skipped.

    Pipeline sequence:
        1.  Parse company_id and quarter_id from filename
        2.  Check if already processed (skip unless force=True)
        3.  Set Realtime DB status to "running"
        4.  Extract text and paragraphs from PDF
        5.  Score sentences with FinBERT
        6.  Update Realtime DB progress every 10 sentences
        7.  Classify aspect for each sentence
        8.  Split transcript into prepared remarks and Q&A
        9.  Fetch prior quarter data for comparison
        10. Compute vocab delta vs prior transcript
        11. Compute overall and aspect-level scores
        12. Generate analyst brief via Groq
        13. Write quarter document to Firestore
        14. Write sentence documents to Firestore (batched)
        15. Set Realtime DB status to "complete"
        16. Return True
    """
    start_time = time.time()

    # Step 1 — Parse filename
    try:
        company_id, quarter_id = parse_filename(pdf_path)
    except ValueError as e:
        print(f"  ✗ {e}")
        return False

    print(f"\n{'='*60}")
    print(f"Processing: {company_id} / {quarter_id}")
    print(f"PDF: {os.path.basename(pdf_path)}")
    print(f"{'='*60}")

    # Step 2 — Skip if already processed
    if not force:
        existing = (
            db.collection(COLLECTION_COMPANIES)
              .document(company_id)
              .collection("quarters")
              .document(quarter_id)
              .get()
        )
        if existing.exists:
            print(f"  → Already processed. Use --force to reprocess.")
            return False

    # Step 3 — Get company info
    company_info = get_company_info(db, company_id)
    company_name = company_info.get("name", company_id)
    sector_id    = company_info.get("sector", "unknown")

    # Step 4 — Extract text from PDF
    print(f"\n[1/9] Extracting text from PDF...")
    try:
        full_text, paragraphs = extract_text_and_paragraphs(pdf_path)
        page_count            = get_page_count(pdf_path)
        print(f"  ✓ {page_count} pages | {len(paragraphs)} paragraphs")
    except Exception as e:
        print(f"  ✗ PDF extraction failed: {e}")
        set_status_error(company_id, quarter_id, str(e))
        return False

    # Step 5 — Score sentences with FinBERT
    print(f"\n[2/9] Scoring sentences with FinBERT...")
    set_status_running(company_id, quarter_id, total_sentences=0)

    try:
        scored = score_sentences(full_text, tokenizer, model)

        # Update Realtime DB as FinBERT processes batches
        # (score_sentences already prints progress — we just update DB)
        set_status_running(company_id, quarter_id, total_sentences=len(scored))

        for i, sentence in enumerate(scored):
            if i % 10 == 0:
                update_progress(company_id, quarter_id, i)

        print(f"  ✓ {len(scored)} sentences scored")

    except Exception as e:
        print(f"  ✗ FinBERT scoring failed: {e}")
        set_status_error(company_id, quarter_id, str(e))
        return False

    # Step 6 — Classify aspects
    print(f"\n[3/9] Classifying aspects...")
    scored = classify_aspects_batch(scored)
    print(f"  ✓ Aspects assigned to all {len(scored)} sentences")

    # Step 7 — Q&A split
    print(f"\n[4/9] Detecting Q&A boundary...")
    split_result  = split_transcript(paragraphs, scored)
    split_scores  = compute_split_scores(split_result)

    if split_scores["boundary_found"]:
        print(
            f"  ✓ Boundary found | "
            f"Prepared: {split_scores['prepared_count']} sentences "
            f"(score={split_scores['prepared_score']:.2f}) | "
            f"Q&A: {split_scores['qa_count']} sentences "
            f"(score={split_scores['qa_score']:.2f})"
        )
    else:
        print(f"  → No Q&A boundary detected")

    # Step 8 — Prior quarter data
    print(f"\n[5/9] Fetching prior quarter data...")
    prior_overall, prior_quarter_id = get_prior_quarter_data(
        db, company_id, quarter_id
    )

    if prior_overall:
        print(
            f"  ✓ Prior quarter: {prior_quarter_id} "
            f"(score={prior_overall['overall_score']:.2f})"
        )
        prior_text = get_prior_transcript_text(company_id, prior_quarter_id)
    else:
        print(f"  → No prior quarter found — first quarter on record")
        prior_text = ""

    # Step 9 — Vocab delta
    print(f"\n[6/9] Computing vocabulary delta...")
    vocab_delta = compute_vocab_delta(full_text, prior_text)
    print(
        f"  ✓ {len(vocab_delta['increased'])} words increased | "
        f"{len(vocab_delta['decreased'])} words decreased"
    )

    # Step 10 — Compute scores
    print(f"\n[7/9] Computing sentiment aggregates...")
    overall       = compute_overall_score(scored)
    aspect_scores = get_aspect_summary(scored)

    print(
        f"  ✓ Overall score: {overall['overall_score']:.2f} | "
        f"Positive: {overall['positive_count']} | "
        f"Negative: {overall['negative_count']} | "
        f"Neutral: {overall['neutral_count']}"
    )

    for aspect, scores in aspect_scores.items():
        print(f"     {aspect:<12} {scores['score']:.2f}")

    # Step 11 — Analyst brief
    print(f"\n[8/9] Generating analyst brief...")
    brief = generate_brief(
        company_name  = company_name,
        quarter_id    = quarter_id,
        overall       = overall,
        aspect_scores = aspect_scores,
        split_scores  = split_scores,
        vocab_delta   = vocab_delta,
        prior_overall = prior_overall,
    )

    # Step 12 — Write to Firestore
    print(f"\n[9/9] Writing to Firestore...")
    try:
        write_quarter(
            db              = db,
            company_id      = company_id,
            quarter_id      = quarter_id,
            overall         = overall,
            aspect_scores   = aspect_scores,
            split_scores    = split_scores,
            vocab_delta     = vocab_delta,
            analyst_brief   = brief,
            transcript_pages= page_count,
        )

        write_sentences(
            db               = db,
            company_id       = company_id,
            quarter_id       = quarter_id,
            scored_sentences = scored,
        )

    except Exception as e:
        print(f"  ✗ Firestore write failed: {e}")
        set_status_error(company_id, quarter_id, str(e))
        return False

    # Step 13 — Mark complete
    set_status_complete(company_id, quarter_id, len(scored))

    elapsed = round(time.time() - start_time, 1)
    print(f"\n✓ {company_id}/{quarter_id} complete in {elapsed}s")

    return True


# ── Entry points ──────────────────────────────────────────────────────────────

def run_single(args, tokenizer, model, db):
    """Processes one specific PDF file."""
    transcripts_dir = os.path.join(os.path.dirname(__file__), "transcripts")
    pdf_path        = os.path.join(
        transcripts_dir,
        f"{args.company}_{args.quarter}.pdf"
    )

    if not os.path.exists(pdf_path):
        print(f"✗ PDF not found: {pdf_path}")
        sys.exit(1)

    success = process_transcript(pdf_path, tokenizer, model, db, force=args.force)

    if success and args.peer_score:
        company_info = get_company_info(db, args.company)
        sector_id    = company_info.get("sector", "unknown")
        update_peer_scores_for_sector(db, sector_id, args.quarter)


def run_batch(args, tokenizer, model, db):
    """
    Processes all PDFs in the transcripts folder.

    Skips already-processed transcripts unless --force is passed.
    Runs peer scoring for each sector after all companies in that
    sector are processed.
    """
    transcripts_dir = os.path.join(os.path.dirname(__file__), "transcripts")
    pdf_files       = sorted([
        f for f in os.listdir(transcripts_dir)
        if f.endswith(".pdf")
    ])

    if not pdf_files:
        print(f"✗ No PDF files found in {transcripts_dir}")
        sys.exit(1)

    print(f"Found {len(pdf_files)} PDFs to process")

    successful  = []
    failed      = []
    skipped     = []

    for filename in pdf_files:
        pdf_path = os.path.join(transcripts_dir, filename)

        try:
            success = process_transcript(
                pdf_path, tokenizer, model, db, force=args.force
            )
            if success:
                company_id, quarter_id = parse_filename(pdf_path)
                successful.append((company_id, quarter_id))
            else:
                skipped.append(filename)
        except Exception as e:
            print(f"✗ Unexpected error processing {filename}: {e}")
            failed.append(filename)

        # Polite delay between transcripts — avoid Groq rate limits
        time.sleep(2)

    # Run peer scoring for all sectors after batch completes
    if args.peer_score and successful:
        print("\n" + "="*60)
        print("Running peer scoring for all processed quarters...")

        # Collect unique sector/quarter combinations
        sectors_quarters = set()
        for company_id, quarter_id in successful:
            info      = get_company_info(db, company_id)
            sector_id = info.get("sector", "unknown")
            sectors_quarters.add((sector_id, quarter_id))

        for sector_id, quarter_id in sorted(sectors_quarters):
            update_peer_scores_for_sector(db, sector_id, quarter_id)

    # Final summary
    print(f"\n{'='*60}")
    print(f"BATCH COMPLETE")
    print(f"{'='*60}")
    print(f"Successful: {len(successful)}")
    print(f"Skipped:    {len(skipped)}  (already processed)")
    print(f"Failed:     {len(failed)}")

    if failed:
        print("\nFailed files:")
        for f in failed:
            print(f"  ✗ {f}")


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="EarningLens inference pipeline"
    )

    # Mode — single or batch
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument(
        "--company",
        type=str,
        help="Company ticker e.g. TATASTEEL"
    )
    mode.add_argument(
        "--batch",
        action="store_true",
        help="Process all PDFs in transcripts/ folder"
    )

    # Single mode requires quarter
    parser.add_argument(
        "--quarter",
        type=str,
        help="Quarter ID e.g. Q3_FY25 (required with --company)"
    )

    # Optional flags
    parser.add_argument(
        "--force",
        action="store_true",
        help="Reprocess even if already in Firestore"
    )
    parser.add_argument(
        "--peer-score",
        action="store_true",
        default=True,
        help="Run peer scoring after processing (default: True)"
    )

    args = parser.parse_args()

    # Validate single mode has quarter
    if args.company and not args.quarter:
        parser.error("--company requires --quarter")

    # Initialise Firebase and load FinBERT once
    print("Initialising Firebase...")
    db = init_firebase()
    print("✓ Firebase connected")

    print("\nLoading FinBERT model...")
    tokenizer, model = load_finbert()
    print("✓ FinBERT ready\n")

    # Run appropriate mode
    if args.batch:
        run_batch(args, tokenizer, model, db)
    else:
        run_single(args, tokenizer, model, db)


if __name__ == "__main__":
    main()