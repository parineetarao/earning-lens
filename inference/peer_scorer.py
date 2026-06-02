# inference/peer_scorer.py

from firebase_admin import firestore
from config import COLLECTION_COMPANIES


def get_sector_companies(db: firestore.Client, sector_id: str) -> list[str]:
    """
    Reads the list of company IDs for a given sector from Firestore.

    What goes in:
        db:        Firestore client
        sector_id: e.g. "steel"

    What comes out:
        A list of company ID strings e.g. ["TATASTEEL", "JSWSTEEL", "SAIL"]
        Returns empty list if sector document does not exist.
    """
    sector_ref = db.collection("sectors").document(sector_id)
    sector_doc = sector_ref.get()

    if not sector_doc.exists:
        return []

    return sector_doc.to_dict().get("companies", [])


def get_quarter_score(
    db:         firestore.Client,
    company_id: str,
    quarter_id: str,
) -> float | None:
    """
    Reads the overall_score for one company-quarter from Firestore.

    What goes in:
        db:         Firestore client
        company_id: e.g. "JSWSTEEL"
        quarter_id: e.g. "Q3_FY25"

    What comes out:
        The overall_score float, or None if the document does not exist.
        None means this company-quarter has not been processed yet.
    """
    ref = (
        db.collection(COLLECTION_COMPANIES)
          .document(company_id)
          .collection("quarters")
          .document(quarter_id)
    )
    doc = ref.get()

    if not doc.exists:
        return None

    return doc.to_dict().get("overall_score", None)


def compute_sector_average(
    db:         firestore.Client,
    sector_id:  str,
    quarter_id: str,
    exclude_company: str | None = None,
) -> dict:
    """
    Computes the sector average sentiment score for a given quarter.

    What goes in:
        db:              Firestore client
        sector_id:       e.g. "steel"
        quarter_id:      e.g. "Q3_FY25"
        exclude_company: optional company ID to exclude from the average.
                         Pass the target company here to compute the
                         peer average excluding itself — a cleaner
                         relative score than including itself.

    What comes out:
        {
            "sector_average": 0.55,
            "companies_included": 3,
            "companies_missing": 1,
            "scores_used": {"JSWSTEEL": 0.52, "SAIL": 0.58, "JINDALSTEL": 0.54}
        }

    Why exclude the target company from its own peer average:
        If TATASTEEL scores 0.48 and is included in the steel average,
        it pulls the average down, making its own relative score look
        less negative than it actually is. Excluding it gives a true
        peer benchmark — what are the OTHER steel companies saying.
    """
    companies   = get_sector_companies(db, sector_id)
    scores_used = {}
    missing     = []

    for company_id in companies:
        if company_id == exclude_company:
            continue

        score = get_quarter_score(db, company_id, quarter_id)

        if score is not None:
            scores_used[company_id] = score
        else:
            missing.append(company_id)

    if not scores_used:
        return {
            "sector_average":       None,
            "companies_included":   0,
            "companies_missing":    len(missing),
            "scores_used":          {},
        }

    sector_average = sum(scores_used.values()) / len(scores_used)

    return {
        "sector_average":     round(sector_average, 4),
        "companies_included": len(scores_used),
        "companies_missing":  len(missing),
        "scores_used":        scores_used,
    }


def compute_relative_score(
    absolute_score:  float,
    sector_average:  float,
) -> dict:
    """
    Computes how far a company sits above or below its sector average.

    What goes in:
        absolute_score: the company's own overall_score e.g. 0.48
        sector_average: the peer average e.g. 0.55

    What comes out:
        {
            "relative_score":    -0.07,
            "relative_label":    "below_peers",
            "absolute_score":    0.48,
            "sector_average":    0.55,
        }

    Relative labels:
        above_peers:   relative_score > +0.05
        in_line:      -0.05 <= relative_score <= +0.05
        below_peers:   relative_score < -0.05

    Why 0.05 as the threshold:
        Sentiment scores computed from 300 sentences have a natural
        variance of roughly +/- 0.03. A difference of 0.05 is outside
        this noise floor and represents a genuine signal. Smaller
        differences are within measurement noise and should not be
        flagged as meaningful divergence.
    """
    relative = round(absolute_score - sector_average, 4)

    if relative > 0.05:
        label = "above_peers"
    elif relative < -0.05:
        label = "below_peers"
    else:
        label = "in_line"

    return {
        "relative_score":  relative,
        "relative_label":  label,
        "absolute_score":  absolute_score,
        "sector_average":  sector_average,
    }


def update_peer_scores_for_sector(
    db:         firestore.Client,
    sector_id:  str,
    quarter_id: str,
) -> None:
    """
    Runs peer scoring for all companies in a sector for one quarter.
    Updates the peer_relative_score field in each company's quarter document.

    What goes in:
        db:         Firestore client
        sector_id:  e.g. "steel"
        quarter_id: e.g. "Q3_FY25"

    What comes out: nothing (updates Firestore documents)

    When to call this:
        After all companies in a sector have been processed for a quarter.
        The pipeline calls this at the end of each sector's processing batch.
        Re-running it is safe — it overwrites the peer_relative_score field
        with fresher data as more companies are processed.
    """
    print(f"\nComputing peer scores for {sector_id} / {quarter_id}...")

    companies = get_sector_companies(db, sector_id)

    if not companies:
        print(f"  ✗ No companies found for sector {sector_id}")
        return

    updated = 0

    for company_id in companies:
        absolute_score = get_quarter_score(db, company_id, quarter_id)

        if absolute_score is None:
            print(f"  → {company_id}: not yet processed, skipping")
            continue

        # Compute sector average excluding this company
        avg_result = compute_sector_average(
            db, sector_id, quarter_id,
            exclude_company=company_id
        )

        if avg_result["sector_average"] is None:
            print(f"  → {company_id}: no peer data available yet, skipping")
            continue

        relative = compute_relative_score(
            absolute_score,
            avg_result["sector_average"]
        )

        # Write relative score back to the quarter document
        (
            db.collection(COLLECTION_COMPANIES)
              .document(company_id)
              .collection("quarters")
              .document(quarter_id)
              .update({
                  "peer_relative_score": relative["relative_score"],
                  "peer_relative_label": relative["relative_label"],
                  "sector_average_score": avg_result["sector_average"],
                  "peer_companies_used": avg_result["companies_included"],
              })
        )

        arrow     = "↑" if relative["relative_score"] > 0 else "↓"
        print(
            f"  ✓ {company_id:<12} "
            f"abs={absolute_score:.2f}  "
            f"sector_avg={avg_result['sector_average']:.2f}  "
            f"relative={relative['relative_score']:+.2f} {arrow}  "
            f"[{relative['relative_label']}]"
        )
        updated += 1

    print(f"  Peer scoring complete — {updated}/{len(companies)} companies updated")