# backend/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import companies, sectors, upload
import os

app = FastAPI(
    title       = "EarningLens API",
    description = "Earnings call sentiment intelligence platform — backend API",
    version     = "1.0.0",
)

# CORS — allow requests from the React frontend on Vercel
# and from localhost during development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",        # Vite dev server
        "http://localhost:3000",        # alternate dev port
        "https://earninglens.vercel.app",  # production frontend
        "*",  # remove this in production and list exact origins
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(companies.router, prefix="/api", tags=["Companies"])
app.include_router(sectors.router,   prefix="/api", tags=["Sectors"])
app.include_router(upload.router,    prefix="/api", tags=["Upload"])


@app.get("/", tags=["Health"])
async def root():
    return {
        "status":  "ok",
        "service": "EarningLens API",
        "version": "1.0.0",
    }


@app.get("/health", tags=["Health"])
async def health():
    """
    Health check endpoint used by Render to verify the service is running.
    Render pings this every 30 seconds — if it returns non-200 three times
    in a row, Render restarts the container.
    """
    try:
        from services.firebase import db
        # Lightweight Firestore check — just verify connection
        db.collection("sectors").limit(1).stream()
        firebase_status = "connected"
    except Exception as e:
        firebase_status = f"error: {str(e)}"

    return {
        "status":   "ok",
        "firebase": firebase_status,
        "version":  "1.0.0",
    }