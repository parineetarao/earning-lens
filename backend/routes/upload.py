# backend/routes/upload.py

import os
import uuid
import fitz  # PyMuPDF
from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from models.schemas import UploadResponse, UploadErrorResponse

router = APIRouter()

# Temporary storage for uploaded PDFs
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

MAX_FILE_SIZE_MB = 50


@router.post(
    "/upload",
    response_model=UploadResponse,
    summary="Upload a transcript PDF",
    description="Validates and stores a transcript PDF for processing.",
)
async def upload_transcript(
    file:       UploadFile = File(...),
    company_id: str        = Form(...),
    quarter_id: str        = Form(...),
):
    """
    Accepts a PDF upload and validates it before saving.

    What goes in:
        file:       the PDF file as multipart form data
        company_id: form field e.g. "TATASTEEL"
        quarter_id: form field e.g. "Q3_FY25"

    What comes out:
        UploadResponse with filename, page count, and size.

    Validation steps:
        1. File must have .pdf extension
        2. File must be under 50MB
        3. File must be a valid PDF (openable by PyMuPDF)
        4. File must have at least 5 pages (filters out notification letters)
        5. File must contain extractable text (not a scanned image)

    Why validate page count and text:
        Without these checks, users could upload notification letters
        or scanned PDFs that would produce 6-sentence outputs with
        overall_score=1.0 — the exact bug we hit in Phase 3.
    """
    # Validate extension
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="File must be a PDF"
        )

    # Read file content
    content = await file.read()

    # Validate file size
    size_mb = len(content) / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        raise HTTPException(
            status_code=400,
            detail=f"File too large: {size_mb:.1f}MB. Maximum is {MAX_FILE_SIZE_MB}MB."
        )

    # Validate it is a real PDF with readable text
    try:
        doc       = fitz.open(stream=content, filetype="pdf")
        page_count = len(doc)

        if page_count < 5:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"PDF has only {page_count} pages. "
                    f"A valid earnings call transcript has at least 10 pages. "
                    f"This may be a notification letter rather than a transcript."
                )
            )

        # Check first few pages have extractable text
        total_chars = sum(
            len(doc[i].get_text())
            for i in range(min(3, page_count))
        )
        doc.close()

        if total_chars < 500:
            raise HTTPException(
                status_code=400,
                detail=(
                    "PDF appears to be a scanned image with no extractable text. "
                    "Please upload a text-based PDF."
                )
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Could not read PDF: {str(e)}"
        )

    # Sanitise inputs
    company_id = company_id.upper().strip()
    quarter_id = quarter_id.upper().strip()

    # Save with standardised filename
    filename  = f"{company_id}_{quarter_id}.pdf"
    save_path = os.path.join(UPLOAD_DIR, filename)

    with open(save_path, "wb") as f:
        f.write(content)

    return UploadResponse(
        message    = f"Transcript uploaded successfully. Run the inference pipeline to process it.",
        company_id = company_id,
        quarter_id = quarter_id,
        filename   = filename,
        pages      = page_count,
        size_kb    = round(len(content) / 1024, 1),
    )