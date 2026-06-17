# EarningLens

**Earnings call intelligence platform for NSE-listed companies.**

EarningLens reads every earnings call transcript from 40 NSE-listed companies, scores every sentence for management tone using FinBERT, and surfaces the signals that move before reported results do.

**Live Platform:** https://earning-lens.vercel.app  
**API:** https://earninglens-backend.onrender.com/docs

---

## What it does

Every quarter, company management holds earnings calls with analysts. What they say — and how they say it — contains forward-looking signals that quantitative models miss. EarningLens makes these signals structured, searchable, and comparable across companies and time.

- **Sentence-level sentiment** — every sentence in every transcript scored individually using FinBERT, a transformer model pre-trained on financial text
- **AI analyst briefs** — a two-paragraph written interpretation of the sentiment data generated for each quarter
- **Guidance drift alerts** — automatic detection when guidance language becomes measurably more cautious quarter-over-quarter
- **Prepared vs Q&A split** — detects the boundary between scripted remarks and unscripted analyst Q&A, scoring both separately
- **Vocabulary shift tracker** — tracks which words management starts and stops using each quarter
- **Peer-relative scoring** — shows each company's sentiment relative to its sector average, not just in absolute terms
- **Sector intelligence heatmap** — 40 companies × 8 quarters visualised in a single view with click-through to any transcript
- **Ask the transcript** — natural language Q&A over any transcript using retrieval-augmented generation

---

## Coverage

**40 companies · 8 sectors · 8 quarters (Q1 FY24 to Q4 FY25)**

| Sector | Companies |
|---|---|
| Banking | HDFCBANK, ICICIBANK, SBIN, AXISBANK, INDUSINDBK |
| IT Services | TCS, WIPRO, HCLTECH, TECHM, LTIM |
| FMCG | HINDUNILVR, BRITANNIA, DABUR, MARICO, NESTLEIND |
| Pharma | SUNPHARMA, DRREDDY, CIPLA, DIVISLAB, AUROPHARMA |
| Auto | BAJAJAUTO, HEROMOTOCO, EICHERMOT, MM, MARUTI |
| Cement | ULTRACEMCO, AMBUJACEM, SHREECEM, ACCLTD, DALMIACEM |
| Steel | SAIL, JINDALSTEL, HINDALCO, TATASTEEL, JSWSTEEL |
| Energy | RELIANCE, NTPC, TATAPOWER, ADANIGREEN, ONGC |

---

## Architecture
LOCAL MACHINE (inference pipeline — never deployed)

↓

bse_scraper.py     → downloads transcript PDFs from BSE India

text_extractor.py  → extracts text from PDFs using PyMuPDF

finbert_scorer.py  → scores every sentence using FinBERT

aspect_classifier.py → classifies sentences into 5 aspects

qa_splitter.py     → detects Q&A boundary, scores both halves

vocab_tracker.py   → computes word frequency delta

analyst_brief.py   → generates written brief via Groq LLaMA 3.1

peer_scorer.py     → computes relative score vs sector average

firestore_writer.py → writes all results to Firestore

↓

FIREBASE FIRESTORE (cloud database)

companies/{id}/quarters/{id} → scores, brief, aspects

companies/{id}/quarters/{id}/sentences/{id} → per-sentence data

↓

┌─────────────────────────┬──────────────────────────┐

│  FASTAPI BACKEND        │  REACT FRONTEND           │

│  (Render)               │  (Vercel)                 │

│                         │                           │

│  /api/companies         │  Firebase Web SDK         │

│  /api/sectors           │  → reads Firestore        │

│  /api/ask (Groq proxy)  │  directly                 │

└─────────────────────────┴──────────────────────────┘

---

## Tech Stack

| Layer | Technology |
|---|---|
| Sentiment model | FinBERT (yiyanghkust/finbert-tone) via HuggingFace |
| LLM for briefs | Groq LLaMA 3.1 8B Instant |
| PDF extraction | PyMuPDF (fitz) |
| Database | Firebase Firestore |
| Realtime updates | Firebase Realtime Database |
| Backend API | FastAPI + Uvicorn |
| Backend deploy | Render (Docker) |
| Frontend | React 18 + Vite |
| Frontend deploy | Vercel |
| Charts | Recharts |
| Animations | GSAP |
| PDF export | jsPDF + html2canvas |

---

## Running locally

**Prerequisites:** Python 3.11, Node.js 18+, Firebase project

**Inference pipeline:**
```bash
cd inference
pip install -r requirements.txt
cp .env.example .env  # add Firebase credentials
python pipeline.py --company HDFCBANK --quarter Q4_FY25
```

**Backend:**
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env  # add Firebase credentials
uvicorn main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
cp .env.example .env  # add Firebase web config
npm run dev
```

---

## Key design decisions

**FinBERT runs locally, never deployed** — the 400MB model stays on the inference machine. The website reads precomputed scores from Firestore. This keeps deployment costs at zero and response times fast.

**Relative scoring over absolute** — all Indian earnings calls score between 0.60 and 0.85 in absolute terms (management language is always positive). The sector heatmap uses relative scores (company vs sector average) to create meaningful visual variation.

**Client-side RAG without a vector database** — the Ask Transcript feature uses BM25-style keyword scoring in the browser to find the 15 most relevant sentences, then sends only those to the LLM. No vector database, no embedding model, no additional infrastructure.

**localStorage caching** — each transcript visit (400+ Firestore reads) is cached in the browser. Return visits cost zero reads, keeping the platform within Firebase's free tier.

---

## Project by

Parineeta Rao · BTech AI & Data Science · 2026
