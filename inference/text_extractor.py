# inference/text_extractor.py

import fitz  # PyMuPDF — the import name is fitz for historical reasons


def extract_text_and_paragraphs(pdf_path: str) -> tuple[str, list[str]]:
    """
    Opens a PDF and extracts its full text content.

    What goes in:
        pdf_path: absolute or relative path to a .pdf file

    What comes out:
        A tuple of two items:
        1. full_text: the entire transcript as a single string
        2. paragraphs: a list of non-empty text blocks, each representing
           a paragraph or speaker turn in the transcript

    Why return both:
        - full_text is used by vocab_tracker.py for word frequency counting
        - paragraphs is used by qa_splitter.py to find the Q&A boundary
          and by finbert_scorer.py after sentence tokenisation
    """
    doc = fitz.open(pdf_path)

    # Accumulate text from every page.
    # page.get_text() returns the raw text of that page as a string.
    # The "\n" between pages ensures page breaks don't merge the last word
    # of one page with the first word of the next.
    raw_pages = []
    for page in doc:
        raw_pages.append(page.get_text())

    doc.close()

    full_text = "\n".join(raw_pages)

    # Split into paragraphs by double newline.
    # Earnings call transcripts use blank lines to separate speaker turns.
    # strip() removes leading/trailing whitespace from each block.
    # The list comprehension filters out empty strings from the split.
    paragraphs = [
        block.strip()
        for block in full_text.split("\n\n")
        if block.strip()
    ]

    return full_text, paragraphs


def get_page_count(pdf_path: str) -> int:
    """
    Returns the number of pages in the PDF.
    Stored in Firestore as transcript_pages for display in the frontend.
    """
    doc = fitz.open(pdf_path)
    count = len(doc)
    doc.close()
    return count