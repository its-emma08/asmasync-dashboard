"""add_requires_verification

Revision ID: doctor_verification_0001
Revises: chat_0001
Create Date: 2026-08-07 00:00:00.000000+00:00

Permite pedir verificación por un administrador a doctores nuevos que se
registran desde el formulario público (con cédula y especialidad). Los doctores
existentes quedan con requires_verification=False y no se ven afectados.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'doctor_verification_0001'
down_revision: Union[str, None] = 'chat_0001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'doctors',
        sa.Column(
            'requires_verification',
            sa.Boolean(),
            nullable=False,
            server_default=sa.text('false'),
        ),
    )


def downgrade() -> None:
    op.drop_column('doctors', 'requires_verification')