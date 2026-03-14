"""Health check router."""
from datetime import datetime, timezone

from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def health_check() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "AI Symbiote API",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
