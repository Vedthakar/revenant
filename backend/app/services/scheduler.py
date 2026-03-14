"""Background sync, evaluation persistence, and score recomputation."""
from __future__ import annotations

import logging
from datetime import date, datetime, timedelta, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import AsyncSessionLocal
from app.models import Engineer, HabitLog, HabitScore, Integration
from app.services.buffer import check_and_flush, push_action
from app.services.evaluator import BatchEvaluationResult, store_habit_memories, evaluate_batch
from app.services.nango import extract_nango_items, get_github_events, normalize_github_event, parse_event_timestamp
from app.services.promoter import promote_best_moment

logger = logging.getLogger(__name__)


async def get_rolling_window_counts(db: AsyncSession, engineer_id: int) -> tuple[int, int, int]:
    window_start = datetime.now(timezone.utc) - timedelta(days=30)
    result = await db.execute(
        select(HabitLog.label).where(
            HabitLog.engineer_id == engineer_id,
            HabitLog.created_at >= window_start,
        )
    )
    labels = result.scalars().all()
    good_count = sum(1 for label in labels if label == "good")
    bad_count = sum(1 for label in labels if label == "bad")
    neutral_count = sum(1 for label in labels if label == "neutral")
    return good_count, bad_count, neutral_count


async def recompute_engineer_score(db: AsyncSession, engineer_id: int) -> HabitScore:
    good_count, bad_count, neutral_count = await get_rolling_window_counts(db, engineer_id)
    total = good_count + bad_count + neutral_count
    score = 0.0 if total == 0 else 100.0 * (good_count + (0.5 * neutral_count)) / total

    today = date.today()
    period_start = today - timedelta(days=29)

    result = await db.execute(
        select(HabitScore).where(
            HabitScore.engineer_id == engineer_id,
            HabitScore.period_start == period_start,
            HabitScore.period_end == today,
        )
    )
    snapshot = result.scalar_one_or_none()
    if snapshot is None:
        snapshot = HabitScore(
            engineer_id=engineer_id,
            score=score,
            period_start=period_start,
            period_end=today,
            good_count=good_count,
            bad_count=bad_count,
            neutral_count=neutral_count,
        )
        db.add(snapshot)
    else:
        snapshot.score = score
        snapshot.good_count = good_count
        snapshot.bad_count = bad_count
        snapshot.neutral_count = neutral_count

    engineer = await db.get(Engineer, engineer_id)
    if engineer is not None:
        engineer.habit_score = score

    await db.flush()
    return snapshot


async def persist_evaluation_batch(
    db: AsyncSession,
    engineer_id: int,
    actions: list[dict[str, Any]],
    batch_result: BatchEvaluationResult,
) -> None:
    logs: list[HabitLog] = []

    if batch_result.error or len(batch_result.evaluations) != len(actions):
        note = batch_result.error or "Evaluator returned an unexpected result shape"
        for action in actions:
            log = HabitLog(
                engineer_id=engineer_id,
                action_type=action.get("action_type", "activity"),
                source=action.get("source", "github"),
                raw_data=action.get("raw_data", action),
                summary=action.get("summary", ""),
                label="pending",
                evaluation_notes=note,
                is_promoted=False,
            )
            db.add(log)
            logs.append(log)
        await db.flush()
        await recompute_engineer_score(db, engineer_id)
        return

    evaluations_by_index = {
        evaluation.action_index: evaluation for evaluation in batch_result.evaluations
    }

    for index, action in enumerate(actions):
        evaluation = evaluations_by_index.get(index)
        if evaluation is None:
            evaluation = next(iter(batch_result.evaluations), None)
        if evaluation is None:
            continue
        log = HabitLog(
            engineer_id=engineer_id,
            action_type=action.get("action_type", "activity"),
            source=action.get("source", "github"),
            raw_data=action.get("raw_data", action),
            summary=action.get("summary", ""),
            label=evaluation.label,
            evaluation_notes=evaluation.reasoning,
            is_promoted=False,
        )
        db.add(log)
        logs.append(log)

    await db.flush()

    for log, evaluation in zip(logs, [evaluations_by_index.get(i) for i in range(len(logs))], strict=False):
        if evaluation is None:
            continue
        if evaluation.is_best_moment and evaluation.best_moment_summary:
            promoted = await promote_best_moment(str(engineer_id), evaluation.best_moment_summary)
            log.is_promoted = promoted

    ordered_evaluations = [
        evaluations_by_index[index]
        for index in range(len(actions))
        if index in evaluations_by_index
    ]
    await store_habit_memories(user_id=str(engineer_id), actions=actions, evaluations=ordered_evaluations)
    await recompute_engineer_score(db, engineer_id)


async def pull_all_engineer_data() -> None:
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Integration)
            .options(selectinload(Integration.engineer))
            .where(
                Integration.provider == "github",
                Integration.connected.is_(True),
                Integration.nango_connection_id.is_not(None),
            )
        )
        integrations = result.scalars().all()

        for integration in integrations:
            try:
                payload = await get_github_events(integration.nango_connection_id or "")
                events = extract_nango_items(payload)
                for event in events:
                    event_timestamp = parse_event_timestamp(event)
                    if integration.last_synced and event_timestamp and event_timestamp <= integration.last_synced:
                        continue
                    normalized = normalize_github_event(event)
                    await push_action(str(integration.engineer_id), normalized)

                flushed_actions = await check_and_flush(str(integration.engineer_id))
                if flushed_actions:
                    batch_result = await evaluate_batch(str(integration.engineer_id), flushed_actions)
                    await persist_evaluation_batch(db, integration.engineer_id, flushed_actions, batch_result)

                integration.last_synced = datetime.now(timezone.utc)
                await db.commit()
            except Exception:
                await db.rollback()
                logger.exception("Failed syncing GitHub activity for engineer_id=%s", integration.engineer_id)
