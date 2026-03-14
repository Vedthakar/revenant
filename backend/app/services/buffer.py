"""Redis-backed action buffering."""
from __future__ import annotations

import json
import logging
from typing import Any

from redis import asyncio as redis
from redis.exceptions import ConnectionError as RedisConnectionError

from app.config import settings

logger = logging.getLogger(__name__)

BUFFER_THRESHOLD = 15
BUFFER_TTL_SECONDS = 14_400

# Simple in-memory fallback for environments without Redis
class MemoryBuffer:
    def __init__(self):
        self.data: dict[str, list[str]] = {}

    async def rpush(self, key: str, value: str):
        if key not in self.data:
            self.data[key] = []
        self.data[key].append(value)

    async def expire(self, key: str, ttl: int):
        pass

    async def llen(self, key: str) -> int:
        return len(self.data.get(key, []))

    async def lrange(self, key: str, start: int, stop: int) -> list[str]:
        return self.data.get(key, [])

    async def delete(self, key: str):
        self.data.pop(key, None)

    async def ping(self):
        return True

try:
    redis_client = redis.from_url(settings.redis_url, decode_responses=True)
    # We don't ping here to avoid blocking startup, but fallback will happen on use if it fails
except Exception:
    logger.warning("Redis not found, using in-memory buffer fallback")
    redis_client = MemoryBuffer()


async def push_action(user_id: str, action: dict[str, Any]) -> None:
    key = f"buffer:{user_id}"
    try:
        await redis_client.rpush(key, json.dumps(action, default=str))
        await redis_client.expire(key, BUFFER_TTL_SECONDS)
    except Exception:
        # If it was a real redis client but failed, swap to memory
        if not isinstance(redis_client, MemoryBuffer):
            logger.warning("Redis push failed, switching to memory buffer")
            globals()['redis_client'] = MemoryBuffer()
            await redis_client.rpush(key, json.dumps(action, default=str))


async def check_and_flush(user_id: str) -> list[dict[str, Any]] | None:
    key = f"buffer:{user_id}"
    try:
        if await redis_client.llen(key) < BUFFER_THRESHOLD:
            return None

        items = await redis_client.lrange(key, 0, -1)
        actions = [json.loads(item) for item in items]
        await redis_client.delete(key)
        return actions
    except Exception:
        return None


async def get_buffer_size(user_id: str) -> int:
    try:
        return int(await redis_client.llen(f"buffer:{user_id}"))
    except Exception:
        return 0
