"""Dashboard data endpoints for engineers."""
from __future__ import annotations

from datetime import date, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_engineer
from app.models import Engineer, HabitLog, HabitScore, Integration
from app.schemas import DashboardSummaryResponse, HabitLogItem, HabitScorePoint, IntegrationStatusItem
from app.services.scheduler import get_rolling_window_counts

router = APIRouter()


@router.get("/summary", response_model=DashboardSummaryResponse)
async def summary(
    current_engineer: Engineer = Depends(get_current_engineer),
    db: AsyncSession = Depends(get_db),
) -> DashboardSummaryResponse:
    good_count, bad_count, neutral_count = await get_rolling_window_counts(db, current_engineer.id)
    integrations_result = await db.execute(
        select(Integration)
        .where(Integration.engineer_id == current_engineer.id)
        .order_by(Integration.provider)
    )
    integrations = integrations_result.scalars().all()
    return DashboardSummaryResponse(
        habit_score=current_engineer.habit_score,
        good_count=good_count,
        bad_count=bad_count,
        neutral_count=neutral_count,
        connected_integrations=[IntegrationStatusItem.model_validate(item) for item in integrations],
    )


@router.get("/activity", response_model=list[HabitLogItem])
async def activity(
    limit: int = Query(default=50, ge=1, le=100),
    current_engineer: Engineer = Depends(get_current_engineer),
    db: AsyncSession = Depends(get_db),
) -> list[HabitLog]:
    result = await db.execute(
        select(HabitLog)
        .where(HabitLog.engineer_id == current_engineer.id)
        .order_by(HabitLog.created_at.desc())
        .limit(limit)
    )
    return result.scalars().all()


@router.get("/chart-data", response_model=list[HabitScorePoint])
async def chart_data(
    current_engineer: Engineer = Depends(get_current_engineer),
    db: AsyncSession = Depends(get_db),
) -> list[HabitScorePoint]:
    today = date.today()
    start_date = today - timedelta(days=29)
    result = await db.execute(
        select(HabitScore)
        .where(
            HabitScore.engineer_id == current_engineer.id,
            HabitScore.period_end >= start_date,
            HabitScore.period_end <= today,
        )
        .order_by(HabitScore.period_end.asc())
    )
    rows = result.scalars().all()
    by_day = {row.period_end: row.score for row in rows}

    data: list[HabitScorePoint] = []
    last_score = 0.0
    for offset in range(30):
        point_day = start_date + timedelta(days=offset)
        if point_day in by_day:
            last_score = by_day[point_day]
        data.append(HabitScorePoint(date=point_day.isoformat(), score=round(last_score, 2)))
    return data


@router.get("/promoted", response_model=list[HabitLogItem])
async def promoted(
    current_engineer: Engineer = Depends(get_current_engineer),
    db: AsyncSession = Depends(get_db),
) -> list[HabitLog]:
    result = await db.execute(
        select(HabitLog)
        .where(
            HabitLog.engineer_id == current_engineer.id,
            HabitLog.is_promoted.is_(True),
        )
        .order_by(HabitLog.created_at.desc())
        .limit(20)
    )
    return result.scalars().all()
