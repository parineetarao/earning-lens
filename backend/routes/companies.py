# backend/routes/companies.py

from fastapi import APIRouter, HTTPException
from models.schemas import CompanyResponse, CompanyListResponse
from services.firebase import db

router = APIRouter()


@router.get(
    "/companies",
    response_model=CompanyListResponse,
    summary="List all companies",
    description="Returns all company documents from Firestore. Used by the frontend search component.",
)
async def list_companies():
    """
    Reads all documents from the companies collection and returns them.

    What goes in: nothing (no parameters)

    What comes out:
        {
            "companies": [
                {"ticker": "TCS", "name": "Tata Consultancy Services",
                 "sector": "it_services", "nse_code": "TCS"},
                ...
            ],
            "total": 34
        }

    Why async:
        FastAPI is async-native. Using async def allows the server to
        handle other requests while waiting for Firestore to respond.
        Firestore reads are I/O-bound — the CPU is idle while waiting
        for the network response. async lets that idle time be used
        for other requests.

    What could go wrong:
        Firestore is unavailable — returns 503.
        Collection is empty — returns empty list with total=0.
    """
    try:
        docs      = db.collection("companies").stream()
        companies = []

        for doc in docs:
            data = doc.to_dict()
            companies.append(CompanyResponse(
                ticker   = data.get("ticker",   doc.id),
                name     = data.get("name",     doc.id),
                sector   = data.get("sector",   "unknown"),
                nse_code = data.get("nse_code", doc.id),
            ))

        # Sort alphabetically by ticker for consistent frontend rendering
        companies.sort(key=lambda c: c.ticker)

        return CompanyListResponse(
            companies=companies,
            total=len(companies)
        )

    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Firestore unavailable: {str(e)}"
        )


@router.get(
    "/companies/{company_id}",
    response_model=CompanyResponse,
    summary="Get single company",
)
async def get_company(company_id: str):
    """
    Returns a single company document by ticker ID.

    What goes in:
        company_id: path parameter e.g. /companies/TCS

    What comes out:
        Single CompanyResponse dict, or 404 if not found.
    """
    try:
        doc = db.collection("companies").document(company_id.upper()).get()

        if not doc.exists:
            raise HTTPException(
                status_code=404,
                detail=f"Company {company_id} not found"
            )

        data = doc.to_dict()
        return CompanyResponse(
            ticker   = data.get("ticker",   doc.id),
            name     = data.get("name",     doc.id),
            sector   = data.get("sector",   "unknown"),
            nse_code = data.get("nse_code", doc.id),
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Firestore unavailable: {str(e)}"
        )