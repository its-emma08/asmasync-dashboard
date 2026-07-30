# backend/app/api/v1/interventions.py
from typing import Any, List
from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.services.intervention_service import InterventionService
from app.services.audit_service import AuditService
from app.schemas.intervention import Intervention, InterventionCreate
from app.models.user import User

router = APIRouter()

@router.get("", response_model=List[Intervention])
async def read_interventions(
    patient_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Obtener intervenciones de un paciente.
    """
    return await InterventionService.get_by_patient(db, patient_id)

@router.post("", response_model=Intervention)
async def create_intervention(
    request: Request,
    intervention_in: InterventionCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Registrar nueva intervención.
    """
    intervention = await InterventionService.create(
        db, intervention_in, nurse_id=current_user.id
    )
    
    await AuditService.log_action(
        db,
        action="CREATE",
        entity="intervention",
        entity_id=intervention.id,
        changes=intervention_in.model_dump(mode='json'),
        user_id=current_user.id,
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent")
    )
    await db.commit()
    
    return intervention
