# backend/main.py

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from routes import companies, sectors, upload
import os
import httpx
from pydantic import BaseModel



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
        "https://earning-lens.vercel.app",  # production frontend
        "https://earninglens-backend.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(companies.router, prefix="/api", tags=["Companies"])
app.include_router(sectors.router,   prefix="/api", tags=["Sectors"])
app.include_router(upload.router,    prefix="/api", tags=["Upload"])

class AskRequest(BaseModel):
    question: str
    sentences: list[dict]
    company_name: str
    quarter_id: str
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
@app.post("/api/ask")
async def ask_transcript(request: AskRequest):
    groq_api_key = os.environ.get("GROQ_API_KEY")
    if not groq_api_key:
        raise HTTPException(status_code=500, detail="Groq not configured")
    
    # Build the same prompt your frontend currently uses
    sentence_list = "\n".join([
        f"[{i}] (index:{s.get('sentence_index', i)}) \"{s.get('text', '')}\""
        for i, s in enumerate(request.sentences[:15])
    ])
    
    prompt = f"""You are a senior equity research analyst reviewing an earnings call transcript for {request.company_name} ({request.quarter_id}).

An analyst has asked: "{request.question}"

Here are the most relevant sentences from the transcript:
{sentence_list}

Return ONLY valid JSON in this exact format:
{{
  "answer": "Your 2-4 sentence answer here.",
  "relevantIndices": [0, 1, 2],
  "confidence": "high"
}}"""

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {groq_api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": "llama-3.1-8b-instant",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.1,
                "max_tokens": 600,
                "response_format": {"type": "json_object"},
            },
            timeout=30,
        )
        response.raise_for_status()
        data = response.json()
        content = data["choices"][0]["message"]["content"]
        return {"result": content}