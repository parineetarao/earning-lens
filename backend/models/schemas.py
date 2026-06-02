# backend/models/schemas.py

from pydantic import BaseModel, Field
from typing import Optional


class CompanyResponse(BaseModel):
    """Single company document as returned by the API."""
    ticker:   str
    name:     str
    sector:   str
    nse_code: str


class CompanyListResponse(BaseModel):
    """List of all companies."""
    companies: list[CompanyResponse]
    total:     int


class SectorResponse(BaseModel):
    """Single sector document."""
    sector_id: str
    name:      str
    companies: list[str]


class SectorListResponse(BaseModel):
    """List of all sectors."""
    sectors: list[SectorResponse]
    total:   int


class UploadResponse(BaseModel):
    """Response after a PDF is successfully uploaded and validated."""
    message:     str
    company_id:  str
    quarter_id:  str
    filename:    str
    pages:       int
    size_kb:     float


class UploadErrorResponse(BaseModel):
    """Response when a PDF upload fails validation."""
    error:   str
    detail:  Optional[str] = None


class HealthResponse(BaseModel):
    """Health check response."""
    status:   str
    firebase: str
    version:  str