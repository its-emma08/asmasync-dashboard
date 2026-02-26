from typing import Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import desc

from app.api import deps
from app.models.user import User
from app.models.audit_log import AuditLog

router = APIRouter()

@router.get("/audit-logs")
async def get_audit_logs(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_doctor_user),
    limit: int = 50
) -> Any:
    """
    Recupera el historial de auditoría de seguridad para trazabilidad.
    Accesible únicamente por roles administrativos/doctores.
    """
    stmt = (
        select(AuditLog)
        .order_by(desc(AuditLog.created_at))
        .limit(limit)
    )
    result = await db.execute(stmt)
    logs = result.scalars().all()
    
    # Formateamos manualmente para evitar crear un Pydantic Model estrictamente para esto
    # o bien podríamos simplemente retornarlo. FastAPI serializa los diccionarios.
    response = []
    for log in logs:
        # Se asume que el user podría o no venir cargado, pero como en el log de auditoría
        # tenemos user_id, y muchas veces se logea sin estar logeado (ej. login fallido),
        # basta con mandar la metadata original.
        response.append({
            "id": log.id,
            "user_id": log.user_id,
            "action": log.action,
            "entity": log.entity,
            "entity_id": log.entity_id,
            "changes": log.changes,
            "ip_address": log.ip_address,
            "user_agent": log.user_agent,
            "created_at": log.created_at.isoformat() if log.created_at else None
        })
        
    return response
