"""Unified.to API client and event normalization helpers."""
from __future__ import annotations

import hashlib
import hmac
import logging
from datetime import datetime, timezone
from typing import Any
from urllib.parse import urlencode

import httpx

from app.config import settings

logger = logging.getLogger(__name__)


def _base_url() -> str:
    return settings.unified_base_url.rstrip("/")


def unified_headers() -> dict[str, str]:
    return {
        "Authorization": f"Bearer {settings.unified_api_key}",
        "Content-Type": "application/json",
    }


def _unwrap_object(payload: Any) -> dict[str, Any]:
    if isinstance(payload, dict):
        data = payload.get("data")
        if isinstance(data, dict):
            return data
        return payload
    return {}


def extract_unified_items(payload: Any) -> list[dict[str, Any]]:
    if isinstance(payload, list):
        return [item for item in payload if isinstance(item, dict)]
    if isinstance(payload, dict):
        for key in ("data", "records", "results", "items"):
            value = payload.get(key)
            if isinstance(value, list):
                return [item for item in value if isinstance(item, dict)]
    return []


def parse_unified_timestamp(record: dict[str, Any]) -> datetime | None:
    for key in ("updated_at", "created_at", "timestamp", "occurred_at"):
        value = record.get(key)
        if not value:
            continue
        if isinstance(value, (int, float)):
            return datetime.fromtimestamp(value, tz=timezone.utc)
        if isinstance(value, str):
            try:
                return datetime.fromisoformat(value.replace("Z", "+00:00"))
            except ValueError:
                continue
    return None


def _message_text(data: dict[str, Any]) -> str:
    value = data.get("message") or data.get("content") or data.get("text") or ""
    if isinstance(value, dict):
        return str(value.get("text") or value.get("body") or "")
    return str(value)


async def get_workspace_integrations() -> list[dict[str, Any]]:
    """Return activated integrations in the Unified workspace."""
    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.get(
            f"{_base_url()}/unified/integration/workspace",
            headers=unified_headers(),
            params={
                "workspace_id": settings.unified_workspace_id,
                "env": settings.unified_env,
            },
        )
        response.raise_for_status()
        return extract_unified_items(response.json())


def build_auth_url(
    integration_type: str,
    user_id: str,
    success_redirect: str,
    failure_redirect: str,
) -> str:
    """Build a Unified OAuth URL for an engineer."""
    params = urlencode(
        {
            "redirect": "1",
            "env": settings.unified_env,
            "success_redirect": success_redirect,
            "failure_redirect": failure_redirect,
            "state": user_id,
        }
    )
    return f"{_base_url()}/unified/integration/auth/{settings.unified_workspace_id}/{integration_type}?{params}"


async def get_connection(connection_id: str) -> dict[str, Any]:
    """Fetch details for a Unified connection."""
    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.get(
            f"{_base_url()}/unified/connection/{connection_id}",
            headers=unified_headers(),
        )
        response.raise_for_status()
        return _unwrap_object(response.json())


async def list_repos(connection_id: str) -> list[dict[str, Any]]:
    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.get(
            f"{_base_url()}/repo/{connection_id}/repository",
            headers=unified_headers(),
        )
        response.raise_for_status()
        return extract_unified_items(response.json())


async def list_commits(connection_id: str, repo_id: str | None = None) -> list[dict[str, Any]]:
    params: dict[str, str] = {}
    if repo_id:
        params["repository_id"] = repo_id
    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.get(
            f"{_base_url()}/repo/{connection_id}/commit",
            headers=unified_headers(),
            params=params,
        )
        response.raise_for_status()
        return extract_unified_items(response.json())


async def list_pullrequests(connection_id: str) -> list[dict[str, Any]]:
    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.get(
            f"{_base_url()}/repo/{connection_id}/pullrequest",
            headers=unified_headers(),
        )
        response.raise_for_status()
        return extract_unified_items(response.json())


async def list_messages(connection_id: str, channel_id: str | None = None) -> list[dict[str, Any]]:
    params: dict[str, str] = {}
    if channel_id:
        params["channel_id"] = channel_id
    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.get(
            f"{_base_url()}/messaging/{connection_id}/message",
            headers=unified_headers(),
            params=params,
        )
        response.raise_for_status()
        return extract_unified_items(response.json())


async def send_message(connection_id: str, channel_id: str, text: str) -> dict[str, Any]:
    """Send a normalized message through a connected messaging integration."""
    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.post(
            f"{_base_url()}/messaging/{connection_id}/message",
            headers=unified_headers(),
            json={
                "channel_id": channel_id,
                "message": text,
            },
        )
        response.raise_for_status()
        return _unwrap_object(response.json())


async def list_tickets(connection_id: str) -> list[dict[str, Any]]:
    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.get(
            f"{_base_url()}/ticketing/{connection_id}/ticket",
            headers=unified_headers(),
        )
        response.raise_for_status()
        return extract_unified_items(response.json())


async def create_webhook(
    connection_id: str,
    hook_url: str,
    object_type: str,
    event: str = "updated",
) -> dict[str, Any]:
    """Subscribe to a Unified webhook for a connection."""
    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.post(
            f"{_base_url()}/unified/webhook",
            headers=unified_headers(),
            json={
                "hook_url": hook_url,
                "connection_id": connection_id,
                "object_type": object_type,
                "event": event,
            },
        )
        response.raise_for_status()
        return _unwrap_object(response.json())


async def setup_github_webhooks(connection_id: str, hook_url: str) -> list[dict[str, Any]]:
    """Subscribe to GitHub events used by the scoring pipeline."""
    results = []
    for object_type in ("repo_commit", "repo_pullrequest", "repo_repository"):
        results.append(await create_webhook(connection_id, hook_url, object_type, "updated"))
    return results


async def setup_messaging_webhooks(connection_id: str, hook_url: str) -> list[dict[str, Any]]:
    """Subscribe to Slack or Discord message events."""
    return [await create_webhook(connection_id, hook_url, "messaging_message", "updated")]


async def setup_ticketing_webhooks(connection_id: str, hook_url: str) -> list[dict[str, Any]]:
    """Subscribe to ticket updates for Jira or Linear."""
    return [await create_webhook(connection_id, hook_url, "ticketing_ticket", "updated")]


def verify_webhook_signature(payload_body: bytes, signature: str) -> bool:
    """Validate the Unified webhook signature when a secret is configured."""
    if not settings.unified_webhook_secret:
        return True
    provided = signature.removeprefix("sha256=").strip()
    expected = hmac.new(
        settings.unified_webhook_secret.encode(),
        payload_body,
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, provided)


def normalize_unified_event(
    event_data: dict[str, Any],
    object_type: str,
    provider: str | None = None,
) -> dict[str, Any]:
    """Convert a Unified payload into the app's standard action shape."""
    data = event_data.get("data", event_data)
    if not isinstance(data, dict):
        data = {}
    event_timestamp = parse_unified_timestamp(data) or datetime.now(timezone.utc)
    source = provider or "unified"

    if object_type.startswith("repo_commit"):
        message = str(data.get("message") or "no message")
        return {
            "action_type": "PushEvent",
            "source": provider or "github",
            "summary": f"Committed: {message[:100]}",
            "raw_data": data,
            "timestamp": event_timestamp.isoformat(),
        }

    if object_type.startswith("repo_pullrequest"):
        title = str(data.get("title") or "Untitled PR")
        state = str(data.get("state") or "open")
        return {
            "action_type": "PullRequestEvent",
            "source": provider or "github",
            "summary": f"Pull request [{state}]: {title[:100]}",
            "raw_data": data,
            "timestamp": event_timestamp.isoformat(),
        }

    if object_type.startswith("repo_repository"):
        repo_name = (
            str(data.get("full_name") or "")
            or str((data.get("repository") or {}).get("full_name") or "")
            or str(data.get("name") or "repository")
        )
        return {
            "action_type": "RepositoryEvent",
            "source": provider or "github",
            "summary": f"Repository updated: {repo_name[:100]}",
            "raw_data": data,
            "timestamp": event_timestamp.isoformat(),
        }

    if object_type.startswith("messaging_message"):
        channel_value = data.get("channel") or {}
        channel_name = channel_value.get("name") if isinstance(channel_value, dict) else channel_value
        content = _message_text(data)[:100]
        return {
            "action_type": "MessageEvent",
            "source": source,
            "summary": f"Message in {channel_name or 'unknown channel'}: {content}",
            "raw_data": data,
            "timestamp": event_timestamp.isoformat(),
        }

    if object_type.startswith("ticketing_ticket"):
        title = str(data.get("name") or data.get("subject") or "Untitled ticket")
        status = str(data.get("status") or "unknown")
        return {
            "action_type": "TicketEvent",
            "source": source,
            "summary": f"Ticket [{status}]: {title[:100]}",
            "raw_data": data,
            "timestamp": event_timestamp.isoformat(),
        }

    return {
        "action_type": object_type,
        "source": source,
        "summary": f"Activity: {object_type}",
        "raw_data": data,
        "timestamp": event_timestamp.isoformat(),
    }
