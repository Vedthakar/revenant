"""Moorcheh-backed habit evaluation and per-user memory storage."""
from __future__ import annotations

import json
import re
from typing import Any, Literal

import httpx
from pydantic import BaseModel, Field

from app.config import settings


class EvaluationEntry(BaseModel):
    action_index: int
    label: Literal["good", "bad", "neutral"]
    reasoning: str = ""
    is_best_moment: bool = False
    best_moment_summary: str = ""


class BatchEvaluationResult(BaseModel):
    evaluations: list[EvaluationEntry] = Field(default_factory=list)
    raw_response: str = ""
    error: str | None = None


async def moorcheh_request(path: str, payload: dict[str, Any]) -> dict[str, Any]:
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            f"{settings.moorche_base_url.rstrip('/')}{path}",
            headers={
                "Authorization": f"Bearer {settings.moorche_api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
        )
        response.raise_for_status()
        return response.json()


async def fetch_namespace_context(namespace: str, query: str, top_k: int = 3) -> str:
    if not settings.moorche_api_key:
        return ""

    try:
        data = await moorcheh_request(
            "/memories/search",
            {
                "query": query,
                "collection_id": namespace,
                "top_k": top_k,
            },
        )
    except httpx.HTTPError:
        return ""

    memories = data.get("results") or data.get("memories") or []
    snippets: list[str] = []
    for item in memories[:top_k]:
        content = item.get("content") or item.get("text") or item.get("summary")
        if content:
            snippets.append(str(content))
    return "\n".join(snippets)


async def ask_moorcheh(namespace: str, query: str, ai_model: str | None = None) -> str:
    if not settings.moorche_api_key:
        raise RuntimeError("MOORCHE_API_KEY is not configured")

    data = await moorcheh_request(
        "/answers",
        {
            "namespace": namespace,
            "collection_id": namespace,
            "query": query,
            "ai_model": ai_model,
        },
    )
    return str(
        data.get("answer")
        or data.get("output")
        or data.get("content")
        or data.get("message")
        or ""
    )


def parse_evaluation_response(raw_response: str) -> list[EvaluationEntry]:
    match = re.search(r"\[.*\]", raw_response, re.DOTALL)
    if match is None:
        raise ValueError("Evaluator response did not contain a JSON array")

    parsed = json.loads(match.group(0))
    if not isinstance(parsed, list):
        raise ValueError("Evaluator response was not a list")
    return [EvaluationEntry.model_validate(item) for item in parsed]


async def store_habit_memories(user_id: str, actions: list[dict[str, Any]], evaluations: list[EvaluationEntry]) -> None:
    if not settings.moorche_api_key:
        return

    for action, evaluation in zip(actions, evaluations, strict=False):
        await moorcheh_request(
            "/memories",
            {
                "content": json.dumps(
                    {
                        "summary": action.get("summary", ""),
                        "action_type": action.get("action_type", "activity"),
                        "label": evaluation.label,
                        "reasoning": evaluation.reasoning,
                    }
                ),
                "collection_id": f"user_{user_id}_memory",
                "metadata": {
                    "type": "habit",
                    "quality": evaluation.label,
                    "source": action.get("source", "github"),
                    "timestamp": action.get("timestamp"),
                },
            },
        )


async def evaluate_batch(user_id: str, actions: list[dict[str, Any]]) -> BatchEvaluationResult:
    company_context = await fetch_namespace_context(
        "company_global_wisdom",
        "What are our coding best practices?",
    )
    user_context = await fetch_namespace_context(
        f"user_{user_id}_memory",
        "What are this engineer's strengths and weaknesses?",
    )

    evaluation_prompt = f"""
You are the AI Symbiote evaluating engineering habits.

COMPANY STANDARDS: {company_context or 'None yet.'}
ENGINEER HISTORY: {user_context or 'New engineer.'}

ACTIONS: {json.dumps(actions, indent=2)}

For each action respond with JSON array:
[{{"action_index": 0, "label": "good|bad|neutral", "reasoning": "...", "is_best_moment": false, "best_moment_summary": ""}}]

Respond ONLY with JSON array.
""".strip()

    try:
        raw_response = await ask_moorcheh(
            f"user_{user_id}_memory",
            evaluation_prompt,
            ai_model="anthropic.claude-sonnet-4.5",
        )
        evaluations = parse_evaluation_response(raw_response)
        return BatchEvaluationResult(evaluations=evaluations, raw_response=raw_response)
    except Exception as exc:  # pragma: no cover - network response variability
        return BatchEvaluationResult(error=str(exc))
