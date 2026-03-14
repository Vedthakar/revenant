"""Nango integration management router."""
from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.dependencies import get_current_engineer
from app.models import Engineer, Integration
from app.schemas import IntegrationConnectedRequest, IntegrationStatusItem, NangoSessionResponse
from app.services.nango import create_connect_session

router = APIRouter()
DEFAULT_PROVIDERS = ("github", "discord")


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
