# backend/app/services/audit_service.py
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.audit_log import AuditLog
from typing import Optional, Dict
import json

class AuditService:
    @staticmethod
    async def log_action(
        db: AsyncSession,
        action: str,
        entity: str,
        entity_id: Optional[int] = None,
        changes: Optional[Dict] = None,
        user_id: Optional[int] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> AuditLog:
        """
        Registra una acción en el log de auditoría (NOM-004).
        """
        audit_log = AuditLog(
            user_id=user_id,
            action=action.upper(),
            entity=entity.lower(),
            entity_id=entity_id,
            changes=changes,
            ip_address=ip_address,
            user_agent=user_agent
        )
        db.add(audit_log)
        # No hacemos commit aquí para permitir transacciones atómicas desde el caller
        # Si se requiere guardar inmediatamente, el caller debe hacer commit.
        return audit_log
