# backend/app/api/v1/dashboard.py
from typing import Any
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from app.api import deps
from app.models.patient import Patient, RiskLevel
from app.models.alert import Alert
from app.models.intervention import Intervention
from app.models.user import User
from app.services.patient_service import PatientService
from datetime import datetime, date

router = APIRouter()

@router.get("/metrics")
async def get_dashboard_metrics(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Obtener KPI's para el dashboard principal.
    """
    # Total Pacientes
    total_patients_res = await db.execute(select(func.count(Patient.id)))
    total_patients = total_patients_res.scalar() or 0
    
    # Alertas Críticas (no leídas)
    critical_alerts_res = await db.execute(
        select(func.count(Alert.id))
        .filter(Alert.alert_type == 'critical', Alert.is_viewed == False)
    )
    critical_alerts = critical_alerts_res.scalar() or 0
    
    # Pacientes en Riesgo Moderado (Amarillo)
    moderate_risk_res = await db.execute(
        select(func.count(Patient.id))
        .filter(Patient.risk_level == RiskLevel.YELLOW)
    )
    moderate_risk = moderate_risk_res.scalar() or 0
    
    # Intervenciones Hoy
    today = date.today()
    interventions_today_res = await db.execute(
        select(func.count(Intervention.id))
        .filter(func.date(Intervention.created_at) == today)
    )
    interventions_today = interventions_today_res.scalar() or 0
    
    # Distribución de Riesgo
    risk_distribution = []
    for level in [RiskLevel.GREEN, RiskLevel.YELLOW, RiskLevel.RED]:
        count = await db.execute(select(func.count(Patient.id)).filter(Patient.risk_level == level))
        risk_distribution.append({"level": level.value, "count": count.scalar() or 0})
        
    return {
        "total_patients": total_patients,
        "critical_alerts": critical_alerts,
        "moderate_risk": moderate_risk,
        "interventions_today": interventions_today,
        "risk_distribution": risk_distribution
    }

@router.get("/priority-patients")
async def get_priority_patients(
    limit: int = 5,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Obtener pacientes prioritarios (Riesgo Rojo/Amarillo).
    """
    # Reutilizamos lógica de PatientService pero forzamos orden por riesgo
    # Podemos hacer una query específica aquí si es necesario
    patients, _ = await PatientService.get_multi(db, limit=limit) # El servicio ya ordena por riesgo
    return {"patients": patients}
