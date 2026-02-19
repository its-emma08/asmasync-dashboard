# backend/app/api/v1/alerts.py
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.services.alert_service import AlertService
from app.services.audit_service import AuditService
from app.schemas.alert import Alert, AlertCreate
from app.models.user import User

router = APIRouter()

@router.get("", response_model=List[Alert])
async def read_alerts(
    db: AsyncSession = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 20,
    is_viewed: Optional[bool] = None,
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Obtener lista de alertas.
    """
    alerts, _ = await AlertService.get_multi(
        db, 
        skip=skip, 
        limit=limit, 
        is_viewed=is_viewed,
        user_id=current_user.id
    )
    return alerts

@router.get("/unread-count", response_model=dict)
async def count_unread_alerts(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Contar alertas no leídas.
    """
    count = await AlertService.get_unread_count(db, user_id=current_user.id)
    return {"count": count}

@router.patch("/{id}/mark-read", response_model=Alert)
async def mark_alert_read(
    request: Request,
    id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Marcar alerta como vista.
    """
    alert = await AlertService.get(db, id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alerta no encontrada")
    
    alert = await AlertService.mark_as_viewed(db, alert, user_id=current_user.id)
    
    await AuditService.log_action(
        db,
        action="UPDATE",
        entity="alert",
        entity_id=alert.id,
        changes={"is_viewed": True},
        user_id=current_user.id,
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent")
    )
    await db.commit()
    
    return alert

from app.models.patient import Patient
from sqlalchemy.future import select
from app.schemas.alert import AlertCreate, Alert
from app.services.alert_service import AlertService

@router.post("/test", status_code=201, response_model=Alert)
async def create_test_alert(
    patient_id: int,
    type: str = "critical",
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Dev endpoint: Crear alerta de prueba.
    """
    print(f"DEBUG: create_test_alert patient_id={patient_id} user_id={current_user.id}")
    
    # Verify patient ownership
    stmt = (
        select(Patient)
        .join(Patient.doctors)
        .filter(User.id == current_user.id)
        .filter(Patient.id == patient_id)
    )
    result = await db.execute(stmt)
    patient = result.scalars().first()
    
    if not patient:
        print(f"DEBUG: Patient NOT FOUND for user {current_user.id}")
        raise HTTPException(status_code=404, detail="Paciente no encontrado o no asignado")
    
    print(f"DEBUG: Patient found: {patient.full_name}")
    
    alert_in = AlertCreate(
        patient_id=patient.id,
        alert_type=type,
        message=f"TEST ALERT: {patient.full_name} simuló una caída de PEF."
    )
    
    new_alert = await AlertService.create(db, alert_in)
    
    # Eager load patient for response serialization
    from sqlalchemy.orm import selectinload
    from app.models.alert import Alert as AlertModel

    stmt = select(AlertModel).options(selectinload(AlertModel.patient)).filter(AlertModel.id == new_alert.id)
    result = await db.execute(stmt)
    loaded_alert = result.scalars().first()
    
    return loaded_alert
