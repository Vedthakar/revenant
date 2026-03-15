"""SQLAlchemy ORM models for the AI Symbiote domain."""
from __future__ import annotations

from datetime import date, datetime
from typing import Any

from sqlalchemy import JSON, Boolean, Date, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Engineer(Base):
    __tablename__ = "engineers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    username: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), default="", nullable=False)
    bio: Mapped[str] = mapped_column(Text, default="", nullable=False)
    habit_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    onboarding_complete: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    integrations: Mapped[list[Integration]] = relationship(
        back_populates="engineer",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    habit_logs: Mapped[list[HabitLog]] = relationship(
        back_populates="engineer",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    habit_scores: Mapped[list[HabitScore]] = relationship(
        back_populates="engineer",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    team_members: Mapped[list[TeamMember]] = relationship(
        back_populates="engineer",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class TeamMember(Base):
    __tablename__ = "team_members"
    __table_args__ = (
        UniqueConstraint("engineer_id", "slack_id", name="uq_team_members_engineer_slack_id"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    engineer_id: Mapped[int] = mapped_column(ForeignKey("engineers.id", ondelete="CASCADE"), nullable=False)
    slack_id: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="synced", nullable=False)  # synced, invited, joined
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    engineer: Mapped[Engineer] = relationship(back_populates="team_members", lazy="selectin")


class Integration(Base):
    __tablename__ = "integrations"
    __table_args__ = (
        UniqueConstraint("engineer_id", "provider", name="uq_integrations_engineer_provider"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    engineer_id: Mapped[int] = mapped_column(ForeignKey("engineers.id", ondelete="CASCADE"), nullable=False)
    provider: Mapped[str] = mapped_column(String(50), nullable=False)
    unified_connection_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    connected: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    connected_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_synced: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    engineer: Mapped[Engineer] = relationship(back_populates="integrations", lazy="selectin")


class HabitLog(Base):
    __tablename__ = "habit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    engineer_id: Mapped[int] = mapped_column(ForeignKey("engineers.id", ondelete="CASCADE"), nullable=False, index=True)
    action_type: Mapped[str] = mapped_column(String(100), nullable=False)
    source: Mapped[str] = mapped_column(String(50), nullable=False)
    raw_data: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    summary: Mapped[str] = mapped_column(Text, default="", nullable=False)
    label: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)
    evaluation_notes: Mapped[str] = mapped_column(Text, default="", nullable=False)
    is_promoted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)

    engineer: Mapped[Engineer] = relationship(back_populates="habit_logs", lazy="selectin")


class HabitScore(Base):
    __tablename__ = "habit_scores"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    engineer_id: Mapped[int] = mapped_column(ForeignKey("engineers.id", ondelete="CASCADE"), nullable=False, index=True)
    score: Mapped[float] = mapped_column(Float, nullable=False)
    period_start: Mapped[date] = mapped_column(Date, nullable=False)
    period_end: Mapped[date] = mapped_column(Date, nullable=False)
    good_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    bad_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    neutral_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    engineer: Mapped[Engineer] = relationship(back_populates="habit_scores", lazy="selectin")
