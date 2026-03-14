"""Admin endpoints for reviewing engineers and habit logs."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import get_current_admin
from app.models import Engineer, HabitLog
from app.schemas import AdminEngineerItem, AdminHabitLogItem, HabitLogOverrideRequest
from app.services.scheduler import recompute_engineer_score

router = APIRouter()


def serialize_admin_log(log: HabitLog) -> AdminHabitLogItem:
    return AdminHabitLogItem(
        id=log.id,
        engineer_id=log.engineer_id,
        engineer_username=log.engineer.username,
        engineer_email=log.engineer.email,
        action_type=log.action_type,
        source=log.source,
        summary=log.summary,
        label=log.label,
        evaluation_notes=log.evaluation_notes,
        is_promoted=log.is_promoted,
        created_at=log.created_at,
    )


@router.get("/engineers", response_model=list[AdminEngineerItem])
async def list_engineers(
    _: Engineer = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> list[Engineer]:
    result = await db.execute(
        select(Engineer).order_by(Engineer.habit_score.desc(), Engineer.created_at.asc())
    )
    return result.scalars().all()


@router.get("/logs", response_model=list[AdminHabitLogItem])
async def list_logs(
    label: str | None = Query(default=None),
    source: str | None = Query(default=None),
    engineer_id: int | None = Query(default=None),
    _: Engineer = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> list[AdminHabitLogItem]:
    query = select(HabitLog).options(selectinload(HabitLog.engineer)).order_by(HabitLog.created_at.desc())
    if label:
        query = query.where(HabitLog.label == label)
    if source:
        query = query.where(HabitLog.source == source)
    if engineer_id:
        query = query.where(HabitLog.engineer_id == engineer_id)

    result = await db.execute(query.limit(200))
    return [serialize_admin_log(log) for log in result.scalars().all()]


@router.patch("/logs/{log_id}", response_model=AdminHabitLogItem)
async def override_log(
    log_id: int,
    payload: HabitLogOverrideRequest,
    _: Engineer = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> AdminHabitLogItem:
    result = await db.execute(
        select(HabitLog).options(selectinload(HabitLog.engineer)).where(HabitLog.id == log_id)
    )
    log = result.scalar_one_or_none()
    if log is None:
        raise HTTPException(status_code=404, detail="Habit log not found")
    log.label = payload.label
    if payload.evaluation_notes is not None:
        log.evaluation_notes = payload.evaluation_notes

    await recompute_engineer_score(db, log.engineer_id)
    await db.commit()
    await db.refresh(log)
    await db.refresh(log.engineer)
    return serialize_admin_log(log)
