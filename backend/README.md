# Revenant — FastAPI Backend

Python backend service that handles AI orchestration, Moorcheh memory management, and Claude reasoning pipelines.

## Structure

```
backend/
├── main.py                  # FastAPI app entry point
├── requirements.txt         # Python dependencies
├── .env.example             # Environment variable template
└── app/
    ├── config.py            # Pydantic settings
    └── routers/
        ├── health.py        # GET /health
        ├── chat.py          # POST /api/chat  (Claude via Anthropic SDK)
        └── memory.py        # POST /api/memory/store, GET /api/memory/query
```

## Quick Start

```bash
cd backend

# 1. Create virtual environment
python -m venv venv
venv\Scripts\activate      # Windows
# source venv/bin/activate  # Mac/Linux

# 2. Install dependencies
pip install -r requirements.txt

# 3. Set up environment
copy .env.example .env     # Windows
# cp .env.example .env     # Mac/Linux
# Fill in your API keys in .env

# 4. Run the server
uvicorn main:app --reload --port 8000
```

Server starts at **http://localhost:8000**  
Swagger docs at **http://localhost:8000/docs**

## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/health` | Liveness check |
| `POST` | `/api/chat` | Claude chat completion (Anna persona) |
| `POST` | `/api/chat/stream` | Streaming SSE chat |
| `POST` | `/api/memory/store` | Store a Moorcheh memory fragment |
| `POST` | `/api/memory/query` | Semantic memory search |
| `GET`  | `/api/memory/list` | List stored memories |
| `DELETE` | `/api/memory/{id}` | Delete a memory |

## Environment Variables

```
ANTHROPIC_API_KEY=
MOORCHEH_API_KEY=
TAVUS_API_KEY=
TAVUS_REPLICA_ID=
TAVUS_PERSONA_ID=
```
