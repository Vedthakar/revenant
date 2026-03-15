"""Real-time contextual help lookup for single actions."""
from __future__ import annotations

from app.services.evaluator import ask_moorcheh, fetch_namespace_context


async def provide_immediate_help(user_id: str, action: dict) -> str | None:
    if action.get("action_type") not in {"PushEvent", "PullRequestEvent", "IssuesEvent", "commit"}:
        return None

    user_context = await fetch_namespace_context(
        f"user_{user_id}_memory",
        "What is this engineer currently focusing on?",
    )
    company_context = await fetch_namespace_context(
        "company_global_wisdom",
        "What company best practices are relevant to this event?",
    )

    prompt = (
        "Provide one concise coaching suggestion for this engineer based on the activity.\n"
        f"User context: {user_context or 'None'}\n"
        f"Company context: {company_context or 'None'}\n"
        f"Action: {action}"
    )
    try:
        answer = await ask_moorcheh(
            f"user_{user_id}_memory",
            prompt,
            ai_model="anthropic.claude-sonnet-4.5",
        )
    except Exception:  # pragma: no cover - network response variability
        return None
    return answer or None
