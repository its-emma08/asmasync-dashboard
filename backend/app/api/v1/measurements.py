# backend/app/api/v1/measurements.py
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import desc, func
from datetime import datetime

from app.api import deps
from app.models.user import User
from app.models.patient import Patient, RiskLevel
from app.models.measurement import Measurement
from app.models.vital_signs import VitalSigns
from app.models.alert import Alert
from app.schemas.measurement import Measurement as MeasurementSchema, SpirometryCreate
from app.schemas.vital_signs import VitalSigns as VitalSignsSchema, VitalSignsCreate

router = APIRouter()

 

# RE-PENSANDO:
# El usuario pidió: "Schema VitalSignCreate: user_id (opcional)".
# Y "POST /measurements/vitals".
# Si guardamos todo en Measurement es más fácil para gráficas unificadas.

@router.post("/spirometry", response_model=MeasurementSchema)
async def create_spirometry(
    spirometry_in: SpirometryCreate,
    patient_id: int, # Query param obligatoria si lo hace un médico
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Registrar PEF (Soplido).
    """
    # Verificar acceso al paciente
    stmt = select(Patient).where(Patient.id == patient_id)
    result = await db.execute(stmt)
    patient = result.scalar_one_or_none()
    
    if not patient:
         raise HTTPException(status_code=404, detail="Paciente no encontrado")

    # IDOR Check
    if not current_user.is_superuser and patient.created_by != current_user.id:
         raise HTTPException(status_code=403, detail="No tienes permiso para registrar datos a este paciente")
    
    pbest = patient.personal_best_pef or 500
    pef = spirometry_in.pef
    zone = RiskLevel.GREEN
    
    if pef < (pbest * 0.5):
        zone = RiskLevel.RED
    elif pef < (pbest * 0.8):
        zone = RiskLevel.YELLOW
        
    # Update Patient Risk Level
    if patient.risk_level != zone:
        patient.risk_level = zone
        patient.updated_at = datetime.now()
        db.add(patient) # Mark for update

    # Create Alert if Red
    if zone == RiskLevel.RED:
        alert = Alert(
            patient_id=patient_id,
            alert_type='critical',
            message=f"ALERTA ROJA: PEF {pef} L/min es crítico (<50% del mejor personal). Se requiere atención inmediata.",
            is_viewed=False
        )
        db.add(alert)

    # Crear Measurement
    measure = Measurement(
        patient_id=patient_id,
        measurement_type='pef',
        value=float(pef),
        zone=zone,
        measured_at=spirometry_in.measured_at or datetime.now()
    )
    
    db.add(measure)
    
    # Actualizar Patient current_pef y risk_level si es peor
    # ...
    
    await db.commit()
    await db.refresh(measure)
    return measure


@router.post("/vitals")
async def create_vitals_generic(
    vitals_in: VitalSignsCreate,
    patient_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Guarda SpO2 y FC como Measurements individuales para el paciente.
    Protección contra IDOR: Verifica que el paciente pertenezca al doctor.
    """
    # 1. Verificar existencia del paciente
    stmt = select(Patient).where(Patient.id == patient_id)
    result = await db.execute(stmt)
    patient = result.scalar_one_or_none()
    
    if not patient:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")

    # 2. Verificar propiedad (IDOR)
    # Si el usuario es admin, pasa. Si es doctor, debe haber creado el paciente O estar asignado.
    if current_user.role != 'admin' and patient.created_by != current_user.id:
         # Fallback: Check doctor_patients association if implemented
         # For now, strict: only creator or admin
         raise HTTPException(status_code=403, detail="No tienes permiso para registrar datos a este paciente")
    
    created_count = 0
    ts = vitals_in.measured_at or datetime.now()
    
    # 3. Guardar SpO2 (Validado por Pydantic 50-100)
    if vitals_in.spo2:
        m = Measurement(
            patient_id=patient_id, 
            measurement_type='spo2', 
            value=vitals_in.spo2, 
            measured_at=ts
        )
        db.add(m)
        created_count += 1
        
        # Actualizar snapshot en Patient
        patient.currentSpO2 = vitals_in.spo2
        
    # 4. Guardar FC (Validado por Pydantic 30-250)
    if vitals_in.heart_rate:
        m_hr = Measurement(
            patient_id=patient_id, 
            measurement_type='heart_rate', 
            value=vitals_in.heart_rate, 
            measured_at=ts
        )
        db.add(m_hr)
        created_count += 1
        
    if created_count > 0:
        await db.commit()
        
    return {"status": "ok", "count": created_count, "patient_id": patient_id}
    

@router.get("/history/{patient_id}")
async def get_history(
    patient_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Retorna historial combinado para gráficas.
    Format: { labels: [], pef: [], spo2: [], heart_rate: [] }
    """
    # 1. Verificar existencia del paciente
    stmt = select(Patient).where(Patient.id == patient_id)
    result = await db.execute(stmt)
    patient = result.scalar_one_or_none()

    if not patient:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")

    # 2. Verificar permisos (IDOR Protection)
    if current_user.role != 'admin' and patient.created_by != current_user.id:
         raise HTTPException(status_code=403, detail="No tienes permiso para ver el historial de este paciente")
    
    # Query all measurements for patient
    query = select(Measurement).filter(Measurement.patient_id == patient_id).order_by(Measurement.measured_at)
    result = await db.execute(query)
    measurements = result.scalars().all()
    
    data = {
        "labels": [],
        "pef_values": [],
        "spo2_values": [],
        "hr_values": []
    }
    
    # Process
    # Deberíamos agrupar por fecha/hora si queremos alinearlos, o simplemente devolver arrays crudos
    # Chart.js time scale maneja arrays de {x, y}. Eso es mejor.
    
    pef_data = []
    spo2_data = []
    hr_data = []
    
    for m in measurements:
        item = {"x": m.measured_at.isoformat(), "y": m.value}
        if m.measurement_type == 'pef':
            pef_data.append(item)
        elif m.measurement_type == 'spo2':
            spo2_data.append(item)
        elif m.measurement_type == 'heart_rate':
            hr_data.append(item)
            
    return {
        "pef": pef_data,
        "spo2": spo2_data,
        "heart_rate": hr_data
    }
