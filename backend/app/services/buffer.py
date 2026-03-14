"""Redis-backed action buffering."""
from __future__ import annotations

import json
from typing import Any

from redis import asyncio as redis

from app.config import settings

BUFFER_THRESHOLD = 15
BUFFER_TTL_SECONDS = 14_400

redis_client = redis.from_url(settings.redis_url, decode_responses=True)


async def push_action(user_id: str, action: dict[str, Any]) -> None:
    key = f"buffer:{user_id}"
    await redis_client.rpush(key, json.dumps(action, default=str))
    await redis_client.expire(key, BUFFER_TTL_SECONDS)


async def check_and_flush(user_id: str) -> list[dict[str, Any]] | None:
    key = f"buffer:{user_id}"
    if await redis_client.llen(key) < BUFFER_THRESHOLD:
        return None

    actions = [json.loads(item) for item in await redis_client.lrange(key, 0, -1)]
    await redis_client.delete(key)
    return actions


async def get_buffer_size(user_id: str) -> int:
    return int(await redis_client.llen(f"buffer:{user_id}"))
