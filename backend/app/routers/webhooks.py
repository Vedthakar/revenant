"""Incoming webhook receiver for Unified.to event delivery."""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, HTTPException, Request
from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.models import Integration, TeamMember
from app.services.buffer import check_and_flush, push_action
from app.services.evaluator import evaluate_batch
from app.services.scheduler import persist_evaluation_batch
from app.services.unified import normalize_unified_event, verify_webhook_signature

logger = logging.getLogger(__name__)
router = APIRouter()


def _extract_member_identity(data: dict[str, Any]) -> tuple[str | None, str, str | None]:
    candidates = [
        data.get("author"),
        data.get("user"),
        data.get("sender"),
        data.get("from"),
    ]
    for candidate in candidates:
        if not isinstance(candidate, dict):
            continue
        member_id = candidate.get("id") or candidate.get("user_id") or candidate.get("external_id")
        if not member_id:
            continue
        name = candidate.get("name") or candidate.get("full_name") or candidate.get("display_name") or "Unknown"
        email = candidate.get("email")
        return str(member_id), str(name), str(email) if email else None

    member_id = data.get("user_id") or data.get("author_id")
    if member_id:
        return str(member_id), str(data.get("user_name") or data.get("author_name") or "Unknown"), None
    return None, "Unknown", None


async def _upsert_slack_member(db, engineer_id: int, data: dict[str, Any]) -> None:
    member_id, name, email = _extract_member_identity(data)
    if not member_id:
        return

    result = await db.execute(
        select(TeamMember).where(
            TeamMember.engineer_id == engineer_id,
            TeamMember.slack_id == member_id,
        )
    )
    member = result.scalar_one_or_none()
    if member is None:
        db.add(
            TeamMember(
                engineer_id=engineer_id,
                slack_id=member_id,
                name=name,
                email=email,
            )
        )
        return

    member.name = name
    member.email = email


@router.post("/unified")
async def receive_unified_webhook(request: Request) -> dict[str, Any]:
    """Receive real-time Unified events and feed the existing batch pipeline."""
    body = await request.body()
    signature = request.headers.get("x-unified-signature", "")
    if not verify_webhook_signature(body, signature):
        raise HTTPException(status_code=401, detail="Invalid webhook signature")

    payload = await request.json()
    connection_id = str(payload.get("connection_id") or "")
    object_type = str(payload.get("object_type") or "")
    event_type = str(payload.get("type") or "")

    if not connection_id or not object_type:
        return {"status": "ignored", "reason": "missing connection_id or object_type"}

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Integration).where(Integration.unified_connection_id == connection_id)
        )
        integration = result.scalar_one_or_none()
        if integration is None:
            logger.warning("Unified webhook ignored for unknown connection_id=%s", connection_id)
            return {"status": "ignored", "reason": "unknown connection"}

        engineer_id = integration.engineer_id
        normalized = normalize_unified_event(payload, object_type, provider=integration.provider)
        await push_action(str(engineer_id), normalized)

        if integration.provider == "slack" and object_type.startswith("messaging_message"):
            data = payload.get("data")
            if isinstance(data, dict):
                await _upsert_slack_member(db, engineer_id, data)

        integration.last_synced = datetime.now(timezone.utc)

        flushed_actions = await check_and_flush(str(engineer_id))
        if flushed_actions:
            batch_result = await evaluate_batch(str(engineer_id), flushed_actions)
            await persist_evaluation_batch(db, engineer_id, flushed_actions, batch_result)

        await db.commit()

    return {
        "status": "received",
        "engineer_id": engineer_id,
        "object_type": object_type,
        "type": event_type,
    }
