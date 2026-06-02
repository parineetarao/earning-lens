# inference/firestore_writer.py

import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime, timezone
import os
from dotenv import load_dotenv
from config import (
    FIREBASE_CRED_PATH,
    FIREBASE_PROJECT_ID,
    FIREBASE_DATABASE_URL,
    COLLECTION_COMPANIES,
    GUIDANCE_DRIFT_THRESHOLD,
)

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))


def init_firebase() -> firestore.Client:
    """
    Initialises Firebase Admin SDK and returns a Firestore client.

    What goes in: nothing
    What comes out: a Firestore client object

    Why check if already initialised:
        firebase_admin.initialize_app() throws an error if called twice
        in the same Python process. The pipeline calls init_firebase()
        once at startup and passes the client to all writer functions.
        But if something calls it twice (e.g. during testing), the check
        prevents a crash.
    """
    if not firebase_admin._apps:
        cred = credentials.Certificate(FIREBASE_CRED_PATH)
        firebase_admin.initialize_app(cred, {
            "databaseURL": FIREBASE_DATABASE_URL,
        })

    return firestore.client()


def compute_overall_score(scored_sentences: list[dict]) -> dict:
    """
    Computes the top-level quarterly sentiment aggregate.

    What goes in:
        scored_sentences: full enriched sentence list

    What comes out:
        {
            "overall_score":   0.58,
            "positive_count":  142,
            "negative_count":  67,
            "neutral_count":   91,
            "total_sentences": 300,
        }

    This dict is written directly to the quarter document in Firestore
    alongside aspect_scores and other quarter-level fields.
    """
    positive = sum(1 for s in scored_sentences if s["sentiment"] == "positive")
    negative = sum(1 for s in scored_sentences if s["sentiment"] == "negative")
    neutral  = sum(1 for s in scored_sentences if s["sentiment"] == "neutral")
    total    = len(scored_sentences)

    raw_score     = (positive - negative) / total if total > 0 else 0
    overall_score = round((raw_score + 1) / 2, 4)

    return {
        "overall_score":   overall_score,
        "positive_count":  positive,
        "negative_count":  negative,
        "neutral_count":   neutral,
        "total_sentences": total,
    }


def check_guidance_drift(
    db: firestore.Client,
    company_id: str,
    quarter_id: str,
    current_guidance_score: float,
) -> bool:
    """
    Checks whether guidance sentiment dropped more than the threshold
    compared to the prior quarter.

    What goes in:
        db:                     Firestore client
        company_id:             e.g. "TATASTEEL"
        quarter_id:             e.g. "Q3_FY25"
        current_guidance_score: float from aspect summary

    What comes out:
        True if guidance drift alert should fire, False otherwise.

    How prior quarter is found:
        Quarter IDs follow a predictable pattern. Q3_FY25 → prior is Q2_FY25.
        Q1_FY25 → prior is Q4_FY24. The function computes this mapping
        without hardcoding every quarter.
    """
    # Map current quarter to prior quarter
    quarter_map = {
        "Q1": ("Q4", -1),  # Q1 FY25 → Q4 FY24 (prior FY)
        "Q2": ("Q1",  0),
        "Q3": ("Q2",  0),
        "Q4": ("Q3",  0),
    }

    try:
        parts   = quarter_id.split("_")   # ["Q3", "FY25"]
        q       = parts[0]                # "Q3"
        fy      = parts[1]                # "FY25"
        fy_num  = int(fy[2:])             # 25

        prior_q, fy_offset = quarter_map[q]
        prior_fy           = f"FY{fy_num + fy_offset:02d}"
        prior_quarter_id   = f"{prior_q}_{prior_fy}"   # "Q2_FY25"

    except (IndexError, KeyError, ValueError):
        return False

    # Fetch prior quarter document
    prior_ref = (
        db.collection(COLLECTION_COMPANIES)
          .document(company_id)
          .collection("quarters")
          .document(prior_quarter_id)
    )
    prior_doc = prior_ref.get()

    if not prior_doc.exists:
        return False

    prior_data            = prior_doc.to_dict()
    prior_aspect_scores   = prior_data.get("aspect_scores", {})
    prior_guidance        = prior_aspect_scores.get("guidance", {})
    prior_guidance_score  = prior_guidance.get("score", None)

    if prior_guidance_score is None:
        return False

    drop = prior_guidance_score - current_guidance_score
    return drop > GUIDANCE_DRIFT_THRESHOLD


def write_quarter(
    db:              firestore.Client,
    company_id:      str,
    quarter_id:      str,
    overall:         dict,
    aspect_scores:   dict,
    split_scores:    dict,
    vocab_delta:     dict,
    analyst_brief:   str,
    transcript_pages:int,
    peer_score:      float = None,
) -> None:
    """
    Writes the quarter-level document to Firestore.

    What goes in:
        db:               Firestore client
        company_id:       e.g. "TATASTEEL"
        quarter_id:       e.g. "Q3_FY25"
        overall:          dict from compute_overall_score()
        aspect_scores:    dict from aspect_classifier.get_aspect_summary()
        split_scores:     dict from qa_splitter.compute_split_scores()
        vocab_delta:      dict from vocab_tracker.compute_vocab_delta()
        analyst_brief:    string from analyst_brief.generate_brief()
        transcript_pages: int from text_extractor.get_page_count()
        peer_score:       float or None — relative-to-sector score

    What comes out: nothing (writes to Firestore)

    Firestore path written:
        companies/{company_id}/quarters/{quarter_id}

    Why merge=True:
        If this quarter was previously processed and you re-run the pipeline,
        merge=True updates only the fields provided rather than deleting the
        entire document. This protects against accidentally wiping sentence
        subcollection references.
    """
    guidance_score = aspect_scores.get("guidance", {}).get("score", 0.5)
    drift_alert    = check_guidance_drift(
        db, company_id, quarter_id, guidance_score
    )

    quarter_data = {
        # Overall sentiment
        "overall_score":    overall["overall_score"],
        "positive_count":   overall["positive_count"],
        "negative_count":   overall["negative_count"],
        "neutral_count":    overall["neutral_count"],
        "total_sentences":  overall["total_sentences"],

        # Per-aspect breakdown
        "aspect_scores":    aspect_scores,

        # Prepared remarks vs Q&A split
        "qa_split": {
            "boundary_found":  split_scores["boundary_found"],
            "prepared_score":  split_scores["prepared_score"],
            "prepared_count":  split_scores["prepared_count"],
            "qa_score":        split_scores["qa_score"],
            "qa_count":        split_scores["qa_count"],
            "gap":             split_scores["gap"],
        },

        # Vocabulary shift vs prior quarter
        "vocab_delta": {
            "increased": vocab_delta["increased"][:10],
            "decreased": vocab_delta["decreased"][:10],
        },

        # LLM-generated analyst note
        "analyst_brief":   analyst_brief,

        # Metadata
        "transcript_pages": transcript_pages,
        "processed_at":     datetime.now(timezone.utc).isoformat(),
        "guidance_drift_alert": drift_alert,

        # Peer relative score (None until peer_scorer runs)
        "peer_relative_score": peer_score,
    }

    (
        db.collection(COLLECTION_COMPANIES)
          .document(company_id)
          .collection("quarters")
          .document(quarter_id)
          .set(quarter_data, merge=True)
    )

    print(f"  ✓ Quarter document written: {company_id}/{quarter_id}")
    if drift_alert:
        print(f"  ⚠ Guidance drift alert fired for {company_id} {quarter_id}")


def write_sentences(
    db:               firestore.Client,
    company_id:       str,
    quarter_id:       str,
    scored_sentences: list[dict],
) -> None:
    """
    Writes all sentence documents to Firestore in a single batch.

    What goes in:
        db:               Firestore client
        company_id:       e.g. "TATASTEEL"
        quarter_id:       e.g. "Q3_FY25"
        scored_sentences: enriched list with text, sentiment,
                          confidence, aspect, sentence_index

    What comes out: nothing (writes to Firestore)

    Firestore path written:
        companies/{company_id}/quarters/{quarter_id}/sentences/{sentence_id}

    Why batch writes:
        300 individual write calls would take ~30 seconds due to network
        round-trips. A single batch commit sends all 300 writes in one
        HTTP request and completes in ~2 seconds.

    Why split into batches of 499:
        Firestore's maximum batch size is 500 operations. We use 499
        to leave one slot for the quarter document write if needed.
        For transcripts longer than 499 sentences, we split into
        multiple sequential batches.
    """
    BATCH_LIMIT = 499

    quarter_ref = (
        db.collection(COLLECTION_COMPANIES)
          .document(company_id)
          .collection("quarters")
          .document(quarter_id)
          .collection("sentences")
    )

    total    = len(scored_sentences)
    written  = 0

    for batch_start in range(0, total, BATCH_LIMIT):
        batch = db.batch()
        chunk = scored_sentences[batch_start: batch_start + BATCH_LIMIT]

        for sentence in chunk:
            sentence_id  = f"s_{sentence['sentence_index']:04d}"
            sentence_ref = quarter_ref.document(sentence_id)

            batch.set(sentence_ref, {
                "text":           sentence["text"],
                "sentiment":      sentence["sentiment"],
                "confidence":     sentence["confidence"],
                "aspect":         sentence["aspect"],
                "sentence_index": sentence["sentence_index"],
            })

        batch.commit()
        written += len(chunk)
        print(f"  ✓ Sentences written: {written}/{total}")

    print(f"  ✓ All {total} sentences written for {company_id}/{quarter_id}")