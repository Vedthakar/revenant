"""Authentication router for engineer signup, login, and current-user lookup."""
from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import APIRouter, Depends, HTTPException, status

from app.database import get_db
from app.dependencies import get_current_engineer
from app.models import Engineer, Integration
from app.schemas import EngineerSummary, LoginRequest, LoginResponse, SignupRequest
from app.utils.security import create_access_token, hash_password, verify_password

router = APIRouter()
DEFAULT_PROVIDERS = ("github", "discord", "slack")


async def ensure_default_integrations(db: AsyncSession, engineer: Engineer) -> None:
    result = await db.execute(
        select(Integration.provider).where(Integration.engineer_id == engineer.id)
    )
    existing = set(result.scalars().all())
    for provider in DEFAULT_PROVIDERS:
        if provider not in existing:
            db.add(Integration(engineer_id=engineer.id, provider=provider, connected=False))
    await db.flush()


@router.post("/signup", response_model=EngineerSummary, status_code=status.HTTP_201_CREATED)
async def signup(payload: SignupRequest, db: AsyncSession = Depends(get_db)) -> Engineer:
    email = payload.email.lower()
    username = payload.username.strip()

    existing_email = await db.execute(
        select(Engineer.id).where(func.lower(Engineer.email) == email)
    )
    if existing_email.scalar_one_or_none() is not None:
        raise HTTPException(status_code=400, detail="Email is already registered")

    existing_username = await db.execute(
        select(Engineer.id).where(func.lower(Engineer.username) == username.lower())
    )
    if existing_username.scalar_one_or_none() is not None:
        raise HTTPException(status_code=400, detail="Username is already taken")

    engineer = Engineer(
        email=email,
        username=username,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name.strip(),
    )
    db.add(engineer)
    await db.flush()
    await ensure_default_integrations(db, engineer)
    await db.commit()
    await db.refresh(engineer)
    return engineer


@router.post("/login", response_model=LoginResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)) -> LoginResponse:
    result = await db.execute(
        select(Engineer).where(func.lower(Engineer.email) == payload.email.lower())
    )
    engineer = result.scalar_one_or_none()
    if engineer is None or not verify_password(payload.password, engineer.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    access_token = create_access_token(str(engineer.id))
    return LoginResponse(access_token=access_token, engineer=EngineerSummary.model_validate(engineer))


@router.get("/me", response_model=EngineerSummary)
async def me(current_engineer: Engineer = Depends(get_current_engineer)) -> Engineer:
    return current_engineer
