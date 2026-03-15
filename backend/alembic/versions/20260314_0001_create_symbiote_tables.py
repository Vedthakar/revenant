"""create symbiote tables

Revision ID: 20260314_0001
Revises:
Create Date: 2026-03-14 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa


revision = "20260314_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "engineers",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("username", sa.String(length=100), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("full_name", sa.String(length=255), nullable=False, server_default=""),
        sa.Column("bio", sa.Text(), nullable=False, server_default=""),
        sa.Column("habit_score", sa.Float(), nullable=False, server_default="0"),
        sa.Column("onboarding_complete", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("is_admin", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_engineers_id", "engineers", ["id"])
    op.create_index("ix_engineers_email", "engineers", ["email"], unique=True)
    op.create_index("ix_engineers_username", "engineers", ["username"], unique=True)

    op.create_table(
        "integrations",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("engineer_id", sa.Integer(), sa.ForeignKey("engineers.id", ondelete="CASCADE"), nullable=False),
        sa.Column("provider", sa.String(length=50), nullable=False),
        sa.Column("nango_connection_id", sa.String(length=255), nullable=True),
        sa.Column("connected", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("connected_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_synced", sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint("engineer_id", "provider", name="uq_integrations_engineer_provider"),
    )
    op.create_index("ix_integrations_id", "integrations", ["id"])

    op.create_table(
        "habit_logs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("engineer_id", sa.Integer(), sa.ForeignKey("engineers.id", ondelete="CASCADE"), nullable=False),
        sa.Column("action_type", sa.String(length=100), nullable=False),
        sa.Column("source", sa.String(length=50), nullable=False),
        sa.Column("raw_data", sa.JSON(), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False, server_default=""),
        sa.Column("label", sa.String(length=20), nullable=False, server_default="pending"),
        sa.Column("evaluation_notes", sa.Text(), nullable=False, server_default=""),
        sa.Column("is_promoted", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_habit_logs_id", "habit_logs", ["id"])
    op.create_index("ix_habit_logs_engineer_id", "habit_logs", ["engineer_id"])
    op.create_index("ix_habit_logs_created_at", "habit_logs", ["created_at"])

    op.create_table(
        "habit_scores",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("engineer_id", sa.Integer(), sa.ForeignKey("engineers.id", ondelete="CASCADE"), nullable=False),
        sa.Column("score", sa.Float(), nullable=False),
        sa.Column("period_start", sa.Date(), nullable=False),
        sa.Column("period_end", sa.Date(), nullable=False),
        sa.Column("good_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("bad_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("neutral_count", sa.Integer(), nullable=False, server_default="0"),
    )
    op.create_index("ix_habit_scores_id", "habit_scores", ["id"])
    op.create_index("ix_habit_scores_engineer_id", "habit_scores", ["engineer_id"])

    op.create_table(
        "team_members",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("engineer_id", sa.Integer(), sa.ForeignKey("engineers.id", ondelete="CASCADE"), nullable=False),
        sa.Column("slack_id", sa.String(length=100), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=False, server_default="synced"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("engineer_id", "slack_id", name="uq_team_members_engineer_slack_id"),
    )
    op.create_index("ix_team_members_id", "team_members", ["id"])
    op.create_index("ix_team_members_slack_id", "team_members", ["slack_id"])


def downgrade() -> None:
    op.drop_index("ix_team_members_slack_id", table_name="team_members")
    op.drop_index("ix_team_members_id", table_name="team_members")
    op.drop_table("team_members")

    op.drop_index("ix_habit_scores_engineer_id", table_name="habit_scores")
    op.drop_index("ix_habit_scores_id", table_name="habit_scores")
    op.drop_table("habit_scores")

    op.drop_index("ix_habit_logs_created_at", table_name="habit_logs")
    op.drop_index("ix_habit_logs_engineer_id", table_name="habit_logs")
    op.drop_index("ix_habit_logs_id", table_name="habit_logs")
    op.drop_table("habit_logs")

    op.drop_index("ix_integrations_id", table_name="integrations")
    op.drop_table("integrations")

    op.drop_index("ix_engineers_username", table_name="engineers")
    op.drop_index("ix_engineers_email", table_name="engineers")
    op.drop_index("ix_engineers_id", table_name="engineers")
    op.drop_table("engineers")
