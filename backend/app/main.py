"""FastAPI application entrypoint for the AI Symbiote backend."""
from __future__ import annotations

import asyncio
import logging
from contextlib import asynccontextmanager, suppress

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import admin, auth, chat, dashboard, health, integrations, memory
from app.services.scheduler import pull_all_engineer_data

logger = logging.getLogger(__name__)


async def scheduled_pull() -> None:
    while True:
        try:
            await pull_all_engineer_data()
        except Exception:  # pragma: no cover - scheduler should keep running in prod
            logger.exception("Scheduled GitHub pull failed")
        await asyncio.sleep(1800)


@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(scheduled_pull())
    yield
    task.cancel()
    with suppress(asyncio.CancelledError):
        await task


app = FastAPI(
    title=settings.app_name,
    description="Full-stack backend for AI Symbiote habit tracking and memory orchestration.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, tags=["Health"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])
app.include_router(memory.router, prefix="/api/memory", tags=["Memory"])
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(integrations.router, prefix="/api/integrations", tags=["Integrations"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])


@app.get("/")
async def root() -> dict[str, str]:
    return {"service": settings.app_name, "status": "ok"}
