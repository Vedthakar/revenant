"""Helpers for interacting with Nango connect sessions and proxy APIs."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

import httpx

from app.config import settings
from app.models import Engineer


def nango_headers(integration: str, connection_id: str) -> dict[str, str]:
    return {
        "Authorization": f"Bearer {settings.nango_secret_key}",
        "Provider-Config-Key": integration,
        "Connection-Id": connection_id,
    }


async def create_connect_session(engineer: Engineer) -> str:
    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.post(
            f"{settings.nango_base_url}/connect/sessions",
            headers={
                "Authorization": f"Bearer {settings.nango_secret_key}",
                "Content-Type": "application/json",
            },
            json={
                "end_user": {
                    "id": str(engineer.id),
                    "email": engineer.email,
                    "display_name": engineer.full_name or engineer.username,
                },
                "allowed_integrations": ["github", "discord", "slack"],
            },
        )
        response.raise_for_status()

    data = response.json()
    return data["data"]["token"]


async def get_github_events(connection_id: str) -> Any:
    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.get(
            f"{settings.nango_base_url}/proxy/events",
            headers=nango_headers("github", connection_id),
        )
        response.raise_for_status()
        return response.json()


async def get_github_repos(connection_id: str) -> Any:
    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.get(
            f"{settings.nango_base_url}/proxy/user/repos",
            headers=nango_headers("github", connection_id),
            params={"sort": "updated", "per_page": 10},
        )
        response.raise_for_status()
        return response.json()


async def get_github_commits(connection_id: str, owner: str, repo: str) -> Any:
    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.get(
            f"{settings.nango_base_url}/proxy/repos/{owner}/{repo}/commits",
            headers=nango_headers("github", connection_id),
            params={"per_page": 30},
        )
        response.raise_for_status()
        return response.json()


async def get_slack_users(connection_id: str) -> list[dict[str, Any]]:
    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.get(
            f"{settings.nango_base_url}/proxy/users.list",
            headers=nango_headers("slack", connection_id),
        )
        response.raise_for_status()
        data = response.json()
        members = data.get("members", [])
        if not isinstance(members, list):
            return []
        return [m for m in members if isinstance(m, dict)]


async def send_slack_message(connection_id: str, slack_user_id: str, text: str) -> Any:
    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.post(
            f"{settings.nango_base_url}/proxy/chat.postMessage",
            headers=nango_headers("slack", connection_id),
            json={
                "channel": slack_user_id,
                "text": text,
            },
        )
        response.raise_for_status()
        return response.json()


def extract_nango_items(payload: Any) -> list[dict[str, Any]]:
    if isinstance(payload, list):
        return [item for item in payload if isinstance(item, dict)]
    if isinstance(payload, dict):
        for key in ("data", "records", "events", "items"):
            value = payload.get(key)
            if isinstance(value, list):
                return [item for item in value if isinstance(item, dict)]
    return []


def parse_event_timestamp(event: dict[str, Any]) -> datetime | None:
    for key in ("created_at", "createdAt", "timestamp", "occurred_at"):
        value = event.get(key)
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


def summarize_github_event(event: dict[str, Any]) -> str:
    event_type = event.get("type") or event.get("event_type") or "GitHubActivity"
    repo_name = event.get("repo", {}).get("name") or event.get("repository", {}).get("full_name") or "unknown repo"
    payload = event.get("payload") or {}

    if event_type == "PushEvent":
        commits = payload.get("commits")
        if not isinstance(commits, list):
            commits = []
        # Explicitly cast or handle the slice to satisfy Pyre
        safe_commits: list[dict[str, Any]] = [c for c in commits if isinstance(c, dict)]
        messages = ", ".join(commit.get("message", "commit") for commit in safe_commits[:2]) or "new commits"
        branch = str(payload.get("ref", "refs/heads/main")).split("/")[-1]
        return f"Pushed {len(safe_commits) or 1} commit(s) to {repo_name} on {branch}: {messages}"
    if event_type == "PullRequestEvent":
        action = payload.get("action", "updated")
        pr = payload.get("pull_request") or {}
        title = pr.get("title", "Untitled PR")
        return f"{action.title()} pull request in {repo_name}: {title}"
    if event_type == "PullRequestReviewEvent":
        review = payload.get("review") or {}
        state = review.get("state", "commented")
        return f"Submitted a {state.lower()} PR review in {repo_name}"
    if event_type == "IssueCommentEvent":
        issue = payload.get("issue") or {}
        title = issue.get("title", "an issue")
        return f"Commented on {title} in {repo_name}"
    if event_type == "IssuesEvent":
        action = payload.get("action", "updated")
        issue = payload.get("issue") or {}
        title = issue.get("title", "an issue")
        return f"{action.title()} issue in {repo_name}: {title}"
    if event_type == "WatchEvent":
        return f"Starred {repo_name}"
    return f"Recorded {event_type} activity in {repo_name}"


def normalize_github_event(event: dict[str, Any]) -> dict[str, Any]:
    timestamp = parse_event_timestamp(event) or datetime.now(timezone.utc)
    action_type = event.get("type") or event.get("event_type") or "activity"
    return {
        "action_type": action_type,
        "source": "github",
        "summary": summarize_github_event(event),
        "raw_data": event,
        "timestamp": timestamp.isoformat(),
    }
