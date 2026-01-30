# backend/app/api/v1/patients.py
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.services.patient_service import PatientService
from app.services.audit_service import AuditService
from app.schemas.patient import Patient, PatientCreate, PatientUpdate, PatientListResponse
from app.models.user import User

router = APIRouter()

@router.get("", response_model=PatientListResponse)
async def read_patients(
    db: AsyncSession = Depends(deps.get_db),
    skip: int = 1, # Page number in frontend (1-based) but query logic might expect limit/offset
    limit: int = 10,
    risk_level: Optional[str] = 'all',
    search: Optional[str] = '',
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Recuperar pacientes con paginación y filtros.
    """
    # Ajustar skip para paginación 0-based
    real_skip = (skip - 1) * limit
    if real_skip < 0: real_skip = 0
    
    patients, total = await PatientService.get_multi(
        db, skip=real_skip, limit=limit, risk_level=risk_level, search=search
    )
    return {
        "data": patients,
        "total": total,
        "page": skip,
        "limit": limit
    }

@router.post("", response_model=Patient)
async def create_patient(
    request: Request,
    patient_in: PatientCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Crear nuevo paciente.
    """
    patient = await PatientService.create(db, patient_in, created_by_id=current_user.id)
    
    await AuditService.log_action(
        db,
        action="CREATE",
        entity="patient",
        entity_id=patient.id,
        changes=patient_in.model_dump(mode='json'),
        user_id=current_user.id,
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent")
    )
    await db.commit()
    
    return patient

@router.get("/{id}", response_model=Patient)
async def read_patient(
    id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Obtener paciente por ID.
    """
    patient = await PatientService.get(db, id)
    if not patient:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")
    return patient

@router.patch("/{id}", response_model=Patient)
async def update_patient(
    request: Request,
    id: int,
    patient_in: PatientUpdate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Actualizar paciente.
    """
    patient = await PatientService.get(db, id)
    if not patient:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")
        
    old_data = {k: getattr(patient, k) for k in patient_in.model_dump(exclude_unset=True).keys()}
    
    patient = await PatientService.update(db, patient, patient_in)
    
    await AuditService.log_action(
        db,
        action="UPDATE",
        entity="patient",
        entity_id=patient.id,
        changes={"before": str(old_data), "after": patient_in.model_dump(mode='json', exclude_unset=True)},
        user_id=current_user.id,
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent")
    )
    await db.commit()
    
    return patient
