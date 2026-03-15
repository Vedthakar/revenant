"""Moorcheh semantic memory router."""
from __future__ import annotations

from typing import Optional

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.config import settings

router = APIRouter()


class StoreRequest(BaseModel):
    content: str
    type: str = "general"
    tags: list[str] = Field(default_factory=list)
    metadata: dict = Field(default_factory=dict)


class QueryRequest(BaseModel):
    query: str
    top_k: int = 5
    filter_type: Optional[str] = None



def moorcheh_headers() -> dict[str, str]:
    if not settings.moorche_api_key:
        raise HTTPException(status_code=500, detail="MOORCHE_API_KEY not configured")
    return {
        "Authorization": f"Bearer {settings.moorche_api_key}",
        "Content-Type": "application/json",
    }


@router.post("/store")
async def store_memory(req: StoreRequest):
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(
            f"{settings.moorche_base_url.rstrip('/')}/memories",
            headers=moorcheh_headers(),
            json={
                "content": req.content,
                "collection_id": "revenent_v1",
                "metadata": {
                    "type": req.type,
                    "tags": req.tags,
                    **req.metadata,
                },
            },
        )
        if not response.is_success:
            raise HTTPException(status_code=response.status_code, detail=response.text)
        return response.json()


@router.post("/query")
async def query_memory(req: QueryRequest):
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(
            f"{settings.moorche_base_url.rstrip('/')}/memories/search",
            headers=moorcheh_headers(),
            json={
                "query": req.query,
                "collection_id": "revenent_v1",
                "top_k": req.top_k,
                "filter_type": req.filter_type,
            },
        )
        if not response.is_success:
            raise HTTPException(status_code=response.status_code, detail=response.text)
        return response.json()


@router.get("/list")
async def list_memories(limit: int = 20):
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(
            f"{settings.moorche_base_url.rstrip('/')}/memories",
            headers=moorcheh_headers(),
            params={"limit": limit},
        )
        if not response.is_success:
            raise HTTPException(status_code=response.status_code, detail=response.text)
        return response.json()


@router.delete("/{memory_id}")
async def delete_memory(memory_id: str):
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.delete(
            f"{settings.moorche_base_url.rstrip('/')}/memories/{memory_id}",
            headers=moorcheh_headers(),
        )
        if not response.is_success:
            raise HTTPException(status_code=response.status_code, detail=response.text)
        return {"deleted": memory_id}
