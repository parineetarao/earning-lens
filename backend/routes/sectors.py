# backend/routes/sectors.py

from fastapi import APIRouter, HTTPException
from models.schemas import SectorResponse, SectorListResponse
from services.firebase import db

router = APIRouter()


@router.get(
    "/sectors",
    response_model=SectorListResponse,
    summary="List all sectors",
)
async def list_sectors():
    """
    Returns all sector documents from Firestore.
    Used by the SectorHeatmap component to build the grid.
    """
    try:
        docs    = db.collection("sectors").stream()
        sectors = []

        for doc in docs:
            data = doc.to_dict()
            sectors.append(SectorResponse(
                sector_id = doc.id,
                name      = data.get("name", doc.id),
                companies = data.get("companies", []),
            ))

        sectors.sort(key=lambda s: s.name)

        return SectorListResponse(
            sectors=sectors,
            total=len(sectors)
        )

    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Firestore unavailable: {str(e)}"
        )