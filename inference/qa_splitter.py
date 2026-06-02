# inference/qa_splitter.py

from config import QA_BOUNDARY_PHRASES


def find_qa_boundary(paragraphs: list[str]) -> int | None:
    """
    Scans paragraphs to find the index where the Q&A session begins.

    What goes in:
        paragraphs: the list of text blocks from text_extractor.py

    What comes out:
        The integer index of the first Q&A paragraph, or None if no
        boundary was found.

        If None is returned, the transcript is treated as a single block
        with no prepared/QA split. The QASentimentSplit component on the
        frontend shows "Q&A boundary not detected" in this case.

    Why search from the middle of the transcript:
        The Q&A boundary never appears in the first 30% of a transcript —
        that is always prepared remarks. Starting the search from 30% through
        avoids false positives from phrases like "questions around guidance"
        appearing in the prepared section.
    """
    if not paragraphs:
        return None

    # Start scanning from 30% through the transcript
    start_index = int(len(paragraphs) * 0.30)

    for i, paragraph in enumerate(paragraphs[start_index:], start=start_index):
        lower = paragraph.lower().strip()
        if any(phrase in lower for phrase in QA_BOUNDARY_PHRASES):
            return i

    return None


def split_transcript(
    paragraphs: list[str],
    scored_sentences: list[dict]
) -> dict:
    """
    Splits scored sentences into prepared remarks and Q&A halves.

    What goes in:
        paragraphs: raw paragraph list from text_extractor.py
        scored_sentences: enriched sentence list from aspect_classifier.py
                          (each sentence has text, sentiment, confidence, aspect)

    What comes out:
        A dict with this structure:
        {
            "boundary_found": True,
            "boundary_paragraph_index": 47,
            "prepared": [list of sentence dicts],
            "qa":       [list of sentence dicts],
        }

        If no boundary is found:
        {
            "boundary_found": False,
            "boundary_paragraph_index": None,
            "prepared": [all sentences],
            "qa":       [],
        }

    How sentence assignment works:
        Each scored sentence has a sentence_index (its position among all
        sentences in the transcript). We find which paragraph each sentence
        belongs to by checking whether the sentence text appears in paragraphs
        before or after the boundary paragraph.

        This is an approximation — sentence boundaries do not align perfectly
        with paragraph boundaries. But it is accurate enough for the
        prepared-vs-QA sentiment split feature, which is a directional signal
        not a precise measurement.
    """
    boundary_index = find_qa_boundary(paragraphs)

    if boundary_index is None:
        return {
            "boundary_found":           False,
            "boundary_paragraph_index": None,
            "prepared":                 scored_sentences,
            "qa":                       [],
        }

    # Build a single string of all prepared-remarks paragraphs for lookup.
    # We use this to check whether a sentence appears in the prepared section.
    prepared_text = " ".join(paragraphs[:boundary_index]).lower()

    prepared_sentences = []
    qa_sentences       = []

    for sentence in scored_sentences:
        # Check if this sentence text appears in the prepared remarks block.
        # lower() on both sides for case-insensitive matching.
        if sentence["text"].lower() in prepared_text:
            prepared_sentences.append(sentence)
        else:
            qa_sentences.append(sentence)

    return {
        "boundary_found":           True,
        "boundary_paragraph_index": boundary_index,
        "prepared":                 prepared_sentences,
        "qa":                       qa_sentences,
    }


def compute_split_scores(split_result: dict) -> dict:
    """
    Computes overall sentiment scores for prepared remarks and Q&A separately.

    What goes in:
        split_result: the dict returned by split_transcript()

    What comes out:
        {
            "boundary_found":  True,
            "prepared_score":  0.64,
            "prepared_count":  187,
            "qa_score":        0.38,
            "qa_count":        94,
            "gap":             0.26,
        }

        "gap" is prepared_score minus qa_score.
        A large positive gap means management is more positive in scripted
        remarks than under analyst questioning — a perception management signal.

    Why store counts alongside scores:
        A prepared_score of 0.64 from 12 sentences is much less meaningful
        than 0.64 from 187 sentences. The frontend displays the count so
        analysts can judge the reliability of each score.
    """
    def score_sentences(sentences: list[dict]) -> float:
        if not sentences:
            return 0.5  # neutral default when no sentences
        positive = sum(1 for s in sentences if s["sentiment"] == "positive")
        negative = sum(1 for s in sentences if s["sentiment"] == "negative")
        total    = len(sentences)
        raw      = (positive - negative) / total
        return round((raw + 1) / 2, 4)

    prepared = split_result.get("prepared", [])
    qa       = split_result.get("qa",       [])

    prepared_score = score_sentences(prepared)
    qa_score       = score_sentences(qa)

    return {
        "boundary_found":  split_result["boundary_found"],
        "prepared_score":  prepared_score,
        "prepared_count":  len(prepared),
        "qa_score":        qa_score,
        "qa_count":        len(qa),
        "gap":             round(prepared_score - qa_score, 4),
    }