# backend/app/api/v1/patients.py
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, insert, desc, or_
from sqlalchemy.orm import selectinload, joinedload

from app.api import deps
from app.services.audit_service import AuditService
from app.schemas.patient import Patient as PatientSchema, PatientCreate, PatientUpdate, PatientListResponse
from app.models.patient import Patient, RiskLevel
from app.models.user import User
from app.models.associations import doctor_patients

router = APIRouter()

@router.get("", response_model=PatientListResponse)
async def read_patients(
    db: AsyncSession = Depends(deps.get_db),
    skip: int = 1, # Frontend Page 1-based
    limit: int = 10,
    risk_level: Optional[str] = 'all',
    search: Optional[str] = '',
    current_user: User = Depends(deps.get_current_doctor_user)
) -> Any:
    """
    Recuperar pacientes asignados al doctor logueado.
    """
    real_skip = (skip - 1) * limit
    if real_skip < 0: real_skip = 0

    # Base Query: Patients linked to current doctor
    query = select(Patient).join(Patient.doctors).filter(User.id == current_user.id)

    # Filters
    if search:
        search_filter = or_(
            Patient.full_name.ilike(f"%{search}%"),
            Patient.email.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)
    
    if risk_level and risk_level != 'all':
        query = query.filter(Patient.risk_level == risk_level)

    # Count Total
    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar() or 0

    # Pagination
    query = query.offset(real_skip).limit(limit).order_by(desc(Patient.updated_at))
    result = await db.execute(query)
    patients = result.scalars().all()

    return {
        "data": patients,
        "total": total,
        "page": skip,
        "limit": limit
    }

@router.post("", response_model=PatientSchema)
async def create_patient(
    request: Request,
    patient_in: PatientCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_doctor_user)
) -> Any:
    """
    Crear nuevo paciente y asignarlo al doctor actual.
    """
    try:
        # 2. Crear Objeto Patient
        # Mapeo manual o model_dump
        patient_data = patient_in.model_dump(exclude_unset=True)

        patient = Patient(**patient_data)
        patient.created_by = current_user.id
            
        db.add(patient)
        await db.flush() # Obtener ID

        # 3. Vincular con Doctor (Tabla Asociación)
        # Insertar en doctor_patients
        stmt = insert(doctor_patients).values(doctor_id=current_user.id, patient_id=patient.id)
        await db.execute(stmt)

        # 4. Auditoría
        await AuditService.log_action(
            db,
            action="CREATE_PATIENT",
            entity="patient",
            entity_id=patient.id,
            changes=patient_in.model_dump(mode='json'),
            user_id=current_user.id,
            ip_address=request.client.host
        )

        await db.commit()
        await db.refresh(patient)
        return patient
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{id}", response_model=PatientSchema)
async def read_patient(
    id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_doctor_user)
) -> Any:
    """
    Obtener paciente por ID (Validando acceso).
    """
    # Verificar que el paciente pertenezca al doctor y usar carga ansiosa para evitar N+1
    query = (
        select(Patient)
        .join(Patient.doctors)
        .options(
            selectinload(Patient.measurements),
            selectinload(Patient.alerts),
            selectinload(Patient.interventions),
            selectinload(Patient.clinical_history)
        )
        .filter(User.id == current_user.id, Patient.id == id)
    )
    result = await db.execute(query)
    patient = result.scalars().first()
    
    if not patient:
         # Check if patient exists but not owned (403 vs 404)
         # For simplicity 404
        raise HTTPException(status_code=404, detail="Paciente no encontrado o no asignado.")
        
    return patient

# Implement others (update, delete) if needed similar to create
