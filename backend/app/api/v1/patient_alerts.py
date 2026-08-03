# backend/app/api/v1/patient_alerts.py
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api import deps
from app.models.alert import Alert
from app.models.patient import Patient
from app.models.user import User
from app.schemas.alert import Alert as AlertSchema

router = APIRouter()


@router.get("/patient/{patient_id}", response_model=List[AlertSchema])
async def get_patient_alerts(
    patient_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Get alert history for a specific patient.
    """
    stmt = (
        select(Alert)
        .filter(Alert.patient_id == patient_id)
        .order_by(Alert.created_at.desc())
    )
    result = await db.execute(stmt)
    alerts = result.scalars().all()
    return alerts


@router.patch("/{alert_id}/view", response_model=AlertSchema)
async def mark_patient_alert_viewed(
    alert_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Mark patient alert as viewed.
    """
    stmt = select(Alert).filter(Alert.id == alert_id)
    result = await db.execute(stmt)
    alert = result.scalars().first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alerta no encontrada")

    alert.is_viewed = True
    await db.commit()
    await db.refresh(alert)
    return alert
