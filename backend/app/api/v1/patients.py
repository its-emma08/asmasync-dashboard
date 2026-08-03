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


@router.get("/{id}/action-plan", response_model=dict)
async def get_patient_action_plan(
    id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Obtener Plan de Acción GINA del paciente (Zonas Verde, Amarilla, Roja).
    """
    stmt = select(Patient).filter(Patient.id == id)
    res = await db.execute(stmt)
    patient = res.scalars().first()
    if not patient:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")

    pb = patient.personal_best_pef or 600
    green_min = round(pb * 0.8)
    yellow_min = round(pb * 0.5)

    return {
        "patient_id": patient.id,
        "personal_best_pef": pb,
        "zones": {
            "green": {
                "label": "Zona Verde (Buen Control)",
                "range": f"PEF ≥ {green_min} L/min (≥80%)",
                "instructions": "Tomar medicamento de mantenimiento habitual. Sin síntomas de rescate."
            },
            "yellow": {
                "label": "Zona Amarilla (Precaución)",
                "range": f"PEF {yellow_min}–{green_min-1} L/min (50-79%)",
                "instructions": "Usar inhalador de rescate (Salbutamol 200–400 mcg). Ajustar dosis según indicación médica."
            },
            "red": {
                "label": "Zona Roja (Emergencia Médica)",
                "range": f"PEF < {yellow_min} L/min (<50%)",
                "instructions": "Inhalador de rescate de inmediato. Llamar a urgencias o al médico tratante sin demoras."
            }
        }
    }


@router.put("/{id}/action-plan", response_model=dict)
async def update_patient_action_plan(
    id: int,
    plan_data: dict,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Actualizar el Plan de Acción personalizado del paciente.
    """
    stmt = select(Patient).filter(Patient.id == id)
    res = await db.execute(stmt)
    patient = res.scalars().first()
    if not patient:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")

    if "personal_best_pef" in plan_data and isinstance(plan_data["personal_best_pef"], int):
        patient.personal_best_pef = plan_data["personal_best_pef"]
        await db.commit()

    return {
        "status": "success",
        "message": "Plan de acción actualizado correctamente",
        "patient_id": patient.id
    }


@router.patch("/{id}", response_model=PatientSchema)
async def update_patient(
    id: int,
    patient_in: dict,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Actualizar datos de un paciente.
    """
    stmt = select(Patient).filter(Patient.id == id)
    res = await db.execute(stmt)
    patient = res.scalars().first()
    if not patient:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")

    # Map field names from frontend update payload
    for k, v in patient_in.items():
        if hasattr(patient, k) and v is not None:
            setattr(patient, k, v)

    # Specific aliases
    if "full_name" in patient_in and patient_in["full_name"]:
        patient.full_name = patient_in["full_name"]
    if "first_name" in patient_in or "last_name" in patient_in:
        fn = patient_in.get("first_name") or ""
        ln = patient_in.get("last_name") or ""
        combined = f"{fn} {ln}".strip()
        if combined:
            patient.full_name = combined

    await db.commit()
    await db.refresh(patient)
    return patient


@router.delete("/{id}", response_model=dict)
async def delete_patient(
    id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Eliminar expediente de un paciente.
    """
    await db.delete(patient)
    await db.commit()
    return {"message": f"Paciente #{id} eliminado correctamente", "id": id}


@router.post("/{id}/predict", response_model=dict)
async def predict_patient_crisis(
    id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Calcular predicción de riesgo de crisis para un paciente usando el motor ML GINA.
    """
    from app.ml.predict import predict_crisis_risk
    from app.models.measurement import Measurement

    stmt = select(Patient).options(selectinload(Patient.measurements)).filter(Patient.id == id)
    res = await db.execute(stmt)
    patient = res.scalars().first()
    if not patient:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")

    recent_pefs = [m.pef_value for m in patient.measurements if m.pef_value is not None][-10:]
    patient_data = {
        "recent_pef": recent_pefs,
        "latest_pef": recent_pefs[-1] if recent_pefs else 450,
        "personal_best_pef": patient.personal_best_pef or 500,
        "spo2": getattr(patient, "currentSpO2", 98),
        "heart_rate": getattr(patient, "heart_rate", 75),
    }

    prediction = predict_crisis_risk(patient_data)
    prediction["patient_id"] = id
    prediction["patient_name"] = patient.full_name

    # Actualizar nivel de riesgo en modelo de paciente si cambió
    if prediction["risk_level"] != patient.risk_level:
        patient.risk_level = prediction["risk_level"]
        await db.commit()

    return prediction


@router.get("/{id}/predictions", response_model=List[dict])
async def get_patient_predictions(
    id: int,
    limit: int = 10,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Obtener historial de predicciones de riesgo del paciente.
    """
    from app.ml.predict import predict_crisis_risk

    stmt = select(Patient).options(selectinload(Patient.measurements)).filter(Patient.id == id)
    res = await db.execute(stmt)
    patient = res.scalars().first()
    if not patient:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")

    recent_pefs = [m.pef_value for m in patient.measurements if m.pef_value is not None][-10:]
    patient_data = {
        "recent_pef": recent_pefs,
        "latest_pef": recent_pefs[-1] if recent_pefs else 450,
        "personal_best_pef": patient.personal_best_pef or 500
    }
    prediction = predict_crisis_risk(patient_data)
    prediction["id"] = 1
    prediction["patient_id"] = id

    return [prediction]



