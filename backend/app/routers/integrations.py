"""Nango integration management router."""
from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.dependencies import get_current_engineer
from app.models import Engineer, Integration, TeamMember
from app.schemas import (
    IntegrationConnectedRequest,
    IntegrationStatusItem,
    NangoSessionResponse,
    SlackInviteRequest,
    TeamMemberItem,
)
from app.services.nango import create_connect_session, get_slack_users, send_slack_message

router = APIRouter()
DEFAULT_PROVIDERS = ("github", "discord", "slack")


async def ensure_default_integrations(db: AsyncSession, engineer_id: int) -> list[Integration]:
    result = await db.execute(
        select(Integration).where(Integration.engineer_id == engineer_id)
    )
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


@router.post("/nango-session", response_model=NangoSessionResponse)
async def nango_session(current_engineer: Engineer = Depends(get_current_engineer)) -> NangoSessionResponse:
    if not settings.nango_secret_key:
        raise HTTPException(status_code=500, detail="NANGO_SECRET_KEY is not configured")
    token = await create_connect_session(current_engineer)
    return NangoSessionResponse(token=token)


@router.get("/status", response_model=list[IntegrationStatusItem])
async def integration_status(
    current_engineer: Engineer = Depends(get_current_engineer),
    db: AsyncSession = Depends(get_db),
) -> list[Integration]:
    return await ensure_default_integrations(db, current_engineer.id)


@router.post("/connected", response_model=IntegrationStatusItem)
async def mark_connected(
    payload: IntegrationConnectedRequest,
    current_engineer: Engineer = Depends(get_current_engineer),
    db: AsyncSession = Depends(get_db),
) -> Integration:
    result = await db.execute(
        select(Integration).where(
            Integration.engineer_id == current_engineer.id,
            Integration.provider == payload.provider,
        )
    )
    integration = result.scalar_one_or_none()
    if integration is None:
        integration = Integration(engineer_id=current_engineer.id, provider=payload.provider)
        db.add(integration)

    integration.nango_connection_id = payload.connection_id
    integration.connected = True
    integration.connected_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(integration)
    return integration


@router.post("/webhook/nango")
async def nango_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    # In a real app, verify Nango signature
    data = await request.json()
    connection_id = data.get("connectionId")
    provider = data.get("providerConfigKey")

    if provider == "slack" and connection_id:
        result = await db.execute(select(Integration).where(Integration.nango_connection_id == connection_id))
        integration = result.scalar_one_or_none()
        if integration:
            slack_members = await get_slack_users(connection_id)
            for m in slack_members:
                if m.get("is_bot") or m.get("deleted"):
                    continue
                slack_id = m.get("id")
                if not slack_id:
                    continue
                
                # Check for existing member
                res = await db.execute(
                    select(TeamMember).where(
                        TeamMember.engineer_id == integration.engineer_id,
                        TeamMember.slack_id == slack_id
                    )
                )
                member = res.scalar_one_or_none()
                profile = m.get("profile", {})
                name = profile.get("real_name") or m.get("name") or "Unknown"
                email = profile.get("email")
                
                if not member:
                    member = TeamMember(
                        engineer_id=integration.engineer_id,
                        slack_id=slack_id,
                        name=name,
                        email=email
                    )
                    db.add(member)
                else:
                    member.name = name
                    member.email = email
            await db.commit()
    return {"status": "ok"}


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
            Integration.provider == "slack"
        )
    )
    integration = result.scalar_one_or_none()
    if not integration or not integration.nango_connection_id:
        raise HTTPException(status_code=400, detail="Slack not connected")

    msg = "Hi! I’m inviting you to join MySaas.com (AI Symbiote). Log in here: http://localhost:3000/login"
    await send_slack_message(integration.nango_connection_id, payload.slack_user_id, msg)

    res = await db.execute(
        select(TeamMember).where(
            TeamMember.engineer_id == current_engineer.id,
            TeamMember.slack_id == payload.slack_user_id
        )
    )
    member = res.scalar_one_or_none()
    if member:
        member.status = "invited"
        await db.commit()

    return {"status": "sent"}
