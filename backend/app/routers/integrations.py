"""Unified.to integration management router."""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from urllib.parse import urlencode

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.dependencies import get_current_engineer
from app.models import Engineer, Integration, TeamMember
from app.schemas import AuthUrlResponse, IntegrationStatusItem, SlackInviteRequest, TeamMemberItem
from app.services.unified import (
    build_auth_url,
    get_connection,
    send_message,
    setup_github_webhooks,
    setup_messaging_webhooks,
    setup_ticketing_webhooks,
)

logger = logging.getLogger(__name__)
router = APIRouter()
DEFAULT_PROVIDERS = ("github", "discord", "slack")
SUPPORTED_PROVIDERS = frozenset({"github", "discord", "slack", "jira", "linear", "notion"})


def _frontend_base_url() -> str:
    if settings.allowed_origins:
        return settings.allowed_origins[0].rstrip("/")
    return "http://127.0.0.1:3000"


def _frontend_integrations_url(**params: str) -> str:
    base_url = f"{_frontend_base_url()}/integrations"
    filtered_params = {key: value for key, value in params.items() if value}
    if not filtered_params:
        return base_url
    return f"{base_url}?{urlencode(filtered_params)}"


async def ensure_default_integrations(db: AsyncSession, engineer_id: int) -> list[Integration]:
    result = await db.execute(select(Integration).where(Integration.engineer_id == engineer_id))
    integrations = result.scalars().all()
    by_provider = {item.provider: item for item in integrations}
    updated = False
    for provider in DEFAULT_PROVIDERS:
        if provider not in by_provider:
            integration = Integration(engineer_id=engineer_id, provider=provider, connected=False)
            db.add(integration)
            integrations.append(integration)
            updated = True
    if updated:
        await db.commit()
        result = await db.execute(
            select(Integration).where(Integration.engineer_id == engineer_id).order_by(Integration.provider)
        )
        integrations = result.scalars().all()
    else:
        integrations.sort(key=lambda item: item.provider)
    return integrations


@router.post("/auth-url", response_model=AuthUrlResponse)
async def get_auth_url(
    provider: str = Query(..., min_length=1),
    current_engineer: Engineer = Depends(get_current_engineer),
) -> AuthUrlResponse:
    """Generate a Unified authorization URL for a provider."""
    if not settings.unified_api_key:
        raise HTTPException(status_code=500, detail="UNIFIED_API_KEY is not configured")
    if not settings.unified_workspace_id:
        raise HTTPException(status_code=500, detail="UNIFIED_WORKSPACE_ID is not configured")

    normalized_provider = provider.lower()
    provider_map = {
        "github": "github",
        "discord": "discord",
        "slack": "slack",
        "jira": "jira",
        "linear": "linear",
        "notion": "notion",
    }
    integration_type = provider_map.get(normalized_provider)
    if integration_type is None:
        raise HTTPException(status_code=400, detail=f"Unknown provider: {provider}")

    callback_base = f"{settings.fastapi_base_url.rstrip('/')}/api/integrations/callback"
    success_url = f"{callback_base}?provider={integration_type}"
    failure_url = f"{callback_base}?error=auth_failed&provider={integration_type}"
    return AuthUrlResponse(
        auth_url=build_auth_url(
            integration_type,
            str(current_engineer.id),
            success_url,
            failure_url,
        )
    )


@router.get("/status", response_model=list[IntegrationStatusItem])
async def integration_status(
    current_engineer: Engineer = Depends(get_current_engineer),
    db: AsyncSession = Depends(get_db),
) -> list[Integration]:
    return await ensure_default_integrations(db, current_engineer.id)


@router.get("/callback")
async def integration_callback(
    id: str | None = None,
    state: str | None = None,
    error: str | None = None,
    provider: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    """Persist the Unified connection and return the engineer to the integrations page."""
    if error or not id or not state:
        return RedirectResponse(url=_frontend_integrations_url(error=error or "auth_failed"))

    try:
        engineer_id = int(state)
    except ValueError:
        return RedirectResponse(url=_frontend_integrations_url(error="invalid_state"))

    connection_id = id
    connection: dict[str, object] = {}
    try:
        connection = await get_connection(connection_id)
    except Exception:
        logger.warning("Failed to fetch Unified connection metadata for %s", connection_id, exc_info=True)

    resolved_provider = str(
        connection.get("integration_type")
        or provider
        or "unknown"
    ).lower()
    if resolved_provider not in SUPPORTED_PROVIDERS:
        return RedirectResponse(url=_frontend_integrations_url(error="unknown_provider"))

    result = await db.execute(
        select(Integration).where(
            Integration.engineer_id == engineer_id,
            Integration.provider == resolved_provider,
        )
    )
    integration = result.scalar_one_or_none()
    if integration is None:
        integration = Integration(engineer_id=engineer_id, provider=resolved_provider, connected=False)
        db.add(integration)

    integration.unified_connection_id = connection_id
    integration.connected = True
    integration.connected_at = datetime.now(timezone.utc)
    await db.commit()

    webhook_url = f"{settings.fastapi_base_url.rstrip('/')}/api/webhooks/unified"
    try:
        if resolved_provider == "github":
            await setup_github_webhooks(connection_id, webhook_url)
        elif resolved_provider in {"discord", "slack"}:
            await setup_messaging_webhooks(connection_id, webhook_url)
        elif resolved_provider in {"jira", "linear"}:
            await setup_ticketing_webhooks(connection_id, webhook_url)
    except Exception:
        logger.warning("Failed to register Unified webhooks for %s", connection_id, exc_info=True)

    return RedirectResponse(url=_frontend_integrations_url(connected=resolved_provider))


@router.get("/slack/members", response_model=list[TeamMemberItem])
async def list_slack_members(
    current_engineer: Engineer = Depends(get_current_engineer),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(TeamMember)
        .where(TeamMember.engineer_id == current_engineer.id)
        .order_by(TeamMember.name)
    )
    return result.scalars().all()


@router.post("/slack/invite")
async def send_invite(
    payload: SlackInviteRequest,
    current_engineer: Engineer = Depends(get_current_engineer),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Integration).where(
            Integration.engineer_id == current_engineer.id,
            Integration.provider == "slack",
        )
    )
    integration = result.scalar_one_or_none()
    if not integration or not integration.unified_connection_id:
        raise HTTPException(status_code=400, detail="Slack not connected")

    login_url = f"{_frontend_base_url()}/login"
    message = f"Hi! I’m inviting you to join AI Symbiote. Log in here: {login_url}"
    await send_message(integration.unified_connection_id, payload.slack_user_id, message)

    result = await db.execute(
        select(TeamMember).where(
            TeamMember.engineer_id == current_engineer.id,
            TeamMember.slack_id == payload.slack_user_id,
        )
    )
    member = result.scalar_one_or_none()
    if member is not None:
        member.status = "invited"
        await db.commit()

    return {"status": "sent"}
