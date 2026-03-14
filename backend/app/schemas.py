"""Pydantic schemas for API inputs and outputs."""
from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field

HabitLabel = Literal["good", "bad", "neutral", "pending"]
IntegrationProvider = Literal["github", "discord"]


class EngineerSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    username: str
    full_name: str
    bio: str
    habit_score: float
    onboarding_complete: bool
    is_admin: bool
    created_at: datetime


class SignupRequest(BaseModel):
    email: EmailStr
    username: str = Field(min_length=3, max_length=100)
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(default="", max_length=255)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    engineer: EngineerSummary


class NangoSessionResponse(BaseModel):
    token: str


class IntegrationStatusItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    provider: str
    connected: bool
    connected_at: datetime | None = None
    last_synced: datetime | None = None
    nango_connection_id: str | None = None


class IntegrationConnectedRequest(BaseModel):
    provider: IntegrationProvider
    connection_id: str = Field(min_length=1, max_length=255)


class DashboardSummaryResponse(BaseModel):
    habit_score: float
    good_count: int
    bad_count: int
    neutral_count: int
    connected_integrations: list[IntegrationStatusItem]


class HabitLogItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    action_type: str
    source: str
    summary: str
    label: HabitLabel
    evaluation_notes: str
    is_promoted: bool
    created_at: datetime


class AdminHabitLogItem(HabitLogItem):
    engineer_id: int
    engineer_username: str
    engineer_email: EmailStr


class HabitScorePoint(BaseModel):
    date: str
    score: float


class AdminEngineerItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

class AdminEngineerItem(EngineerSummary):
    pass


class TeamMemberItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    slack_id: str
    name: str
    email: str | None = None
    status: str
    created_at: datetime


class SlackInviteRequest(BaseModel):
    slack_user_id: str


class HabitLogOverrideRequest(BaseModel):
    label: Literal["good", "bad", "neutral"]
    evaluation_notes: str | None = None
