"""Promotion of exceptional habits into the shared company namespace."""
from __future__ import annotations

from datetime import datetime, timezone

from app.services.evaluator import moorcheh_request
from app.config import settings


async def promote_best_moment(user_id: str, moment_summary: str) -> bool:
    if not settings.moorche_api_key or not moment_summary:
        return False

    await moorcheh_request(
        "/memories",
        {
            "content": moment_summary,
            "collection_id": "company_global_wisdom",
            "metadata": {
                "type": "promoted_best_practice",
                "contributor": str(user_id),
                "promoted_at": datetime.now(timezone.utc).isoformat(),
            },
        },
    )
    return True
