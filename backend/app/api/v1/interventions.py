# backend/app/api/v1/interventions.py
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api import deps
from app.services.intervention_service import InterventionService
from app.services.audit_service import AuditService
from app.schemas.intervention import Intervention as InterventionSchema, InterventionCreate, InterventionUpdate
from app.models.intervention import Intervention
from app.models.user import User

router = APIRouter()


@router.get("", response_model=List[InterventionSchema])
async def read_interventions(
    patient_id: Optional[int] = Query(None),
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Obtener lista de intervenciones (filtradas opcionalmente por paciente).
    """
    if patient_id:
        return await InterventionService.get_by_patient(db, patient_id)

    stmt = select(Intervention).order_by(Intervention.created_at.desc())
    res = await db.execute(stmt)
    return res.scalars().all()


@router.get("/patient/{patient_id}", response_model=List[InterventionSchema])
async def get_interventions_by_patient(
    patient_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Obtener intervenciones por ID de paciente (alias directo).
    """
    return await InterventionService.get_by_patient(db, patient_id)


@router.get("/{id}", response_model=InterventionSchema)
async def get_intervention_by_id(
    id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    stmt = select(Intervention).filter(Intervention.id == id)
    res = await db.execute(stmt)
    item = res.scalars().first()
    if not item:
        raise HTTPException(status_code=404, detail="Intervención no encontrada")
    return item


@router.post("", response_model=InterventionSchema, status_code=status.HTTP_201_CREATED)
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


@router.patch("/{id}", response_model=InterventionSchema)
async def update_intervention(
    id: int,
    intervention_in: InterventionUpdate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Actualizar intervención existente.
    """
    stmt = select(Intervention).filter(Intervention.id == id)
    res = await db.execute(stmt)
    item = res.scalars().first()
    if not item:
        raise HTTPException(status_code=404, detail="Intervención no encontrada")

    data = intervention_in.model_dump(exclude_unset=True)
    for field, val in data.items():
        setattr(item, field, val)

    await db.commit()
    await db.refresh(item)
    return item


@router.delete("/{id}", response_model=dict)
async def delete_intervention(
    id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Eliminar intervención.
    """
    stmt = select(Intervention).filter(Intervention.id == id)
    res = await db.execute(stmt)
    item = res.scalars().first()
    if not item:
        raise HTTPException(status_code=404, detail="Intervención no encontrada")

    await db.delete(item)
    await db.commit()
    return {"message": "Intervención eliminada", "id": id}
