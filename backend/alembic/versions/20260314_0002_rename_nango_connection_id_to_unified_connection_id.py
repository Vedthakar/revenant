"""rename nango connection column

Revision ID: 20260314_0002
Revises: 20260314_0001
Create Date: 2026-03-14 00:30:00.000000
"""
from alembic import op
import sqlalchemy as sa


revision = "20260314_0002"
down_revision = "20260314_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column(
        "integrations",
        "nango_connection_id",
        new_column_name="unified_connection_id",
        existing_type=sa.String(length=255),
        existing_nullable=True,
    )


def downgrade() -> None:
    op.alter_column(
        "integrations",
        "unified_connection_id",
        new_column_name="nango_connection_id",
        existing_type=sa.String(length=255),
        existing_nullable=True,
    )
