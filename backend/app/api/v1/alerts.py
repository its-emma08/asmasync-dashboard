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
    alerts, _ = await AlertService.get_multi(db, skip=skip, limit=limit, is_viewed=is_viewed)
    return alerts

@router.get("/unread-count", response_model=dict)
async def count_unread_alerts(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Contar alertas no leídas.
    """
    count = await AlertService.get_unread_count(db)
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
