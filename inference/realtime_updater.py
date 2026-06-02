# inference/realtime_updater.py

from firebase_admin import db as realtime_db
from datetime import datetime, timezone


def get_status_ref(company_id: str, quarter_id: str):
    """
    Returns a Firebase Realtime DB reference for the processing status path.

    What goes in:
        company_id:  e.g. "TATASTEEL"
        quarter_id:  e.g. "Q3_FY25"

    What comes out:
        A Realtime DB reference object pointing to:
        /processing_status/{company_id}/{quarter_id}/

    Why return the ref rather than the path string:
        The ref object has .set() and .update() methods that write directly
        to Realtime DB. Returning it lets the caller reuse the same ref
        for multiple updates without reconstructing the path each time.
    """
    path = f"processing_status/{company_id}/{quarter_id}"
    return realtime_db.reference(path)


def set_status_running(company_id: str, quarter_id: str, total_sentences: int) -> None:
    """
    Writes the initial processing status when inference starts.

    What goes in:
        company_id:       e.g. "TATASTEEL"
        quarter_id:       e.g. "Q3_FY25"
        total_sentences:  total number of sentences to be processed

    What comes out: nothing (writes to Realtime DB)

    Realtime DB path written:
        /processing_status/TATASTEEL/Q3_FY25/
        {
            "status":              "running",
            "sentences_processed": 0,
            "total_sentences":     412,
            "started_at":          "2025-01-27T14:32:00Z"
        }

    The React frontend's LiveIndicator component subscribes to this path
    and renders a progress bar as sentences_processed updates.
    """
    ref = get_status_ref(company_id, quarter_id)
    ref.set({
        "status":              "running",
        "sentences_processed": 0,
        "total_sentences":     total_sentences,
        "started_at":          datetime.now(timezone.utc).isoformat(),
        "completed_at":        None,
    })


def update_progress(
    company_id: str,
    quarter_id: str,
    sentences_processed: int,
) -> None:
    """
    Updates the live sentence count during inference.

    What goes in:
        company_id:          e.g. "TATASTEEL"
        quarter_id:          e.g. "Q3_FY25"
        sentences_processed: how many sentences have been scored so far

    What comes out: nothing (updates Realtime DB)

    Why update only sentences_processed and not the whole object:
        .update() writes only the specified keys, leaving all other keys
        (status, total_sentences, started_at) untouched.
        .set() would overwrite the entire object — losing started_at.

    Why not update on every single sentence:
        Writing to Realtime DB on every sentence (300+ writes) would
        generate unnecessary network traffic. Updating every 10 sentences
        gives a smooth enough progress indicator while keeping writes minimal.
        The pipeline calls this function only when sentence_index % 10 == 0.
    """
    ref = get_status_ref(company_id, quarter_id)
    ref.update({
        "sentences_processed": sentences_processed,
    })


def set_status_complete(company_id: str, quarter_id: str, total_sentences: int) -> None:
    """
    Writes the final status when inference finishes successfully.

    What goes in:
        company_id:      e.g. "TATASTEEL"
        quarter_id:      e.g. "Q3_FY25"
        total_sentences: final count of processed sentences

    What comes out: nothing (updates Realtime DB)

    The frontend's LiveIndicator detects status="complete" and
    switches from a progress bar to a green checkmark.
    """
    ref = get_status_ref(company_id, quarter_id)
    ref.update({
        "status":              "complete",
        "sentences_processed": total_sentences,
        "completed_at":        datetime.now(timezone.utc).isoformat(),
    })


def set_status_error(company_id: str, quarter_id: str, error_message: str) -> None:
    """
    Writes an error status if inference fails midway.

    What goes in:
        company_id:    e.g. "TATASTEEL"
        quarter_id:    e.g. "Q3_FY25"
        error_message: the exception message string

    What comes out: nothing (updates Realtime DB)

    The frontend detects status="error" and shows a red error badge
    instead of a progress bar so the analyst knows the run failed.
    """
    ref = get_status_ref(company_id, quarter_id)
    ref.update({
        "status":       "error",
        "error":        error_message,
        "completed_at": datetime.now(timezone.utc).isoformat(),
    })