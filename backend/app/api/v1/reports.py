# backend/app/api/v1/reports.py
from typing import Any, List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.api import deps
from app.models.user import User
from app.models.patient import Patient
from app.models.measurement import Measurement
from app.models.intervention import Intervention
from app.models.appointment import Appointment
from app.models.medical import ClinicalHistory, PhysicalExam
from app.services.pdf_service import PDFService

router = APIRouter()


@router.get("/patient/{patient_id}", response_model=dict)
async def get_patient_report_data(
    patient_id: int,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Obtener datos consolidados para el reporte clínico del paciente.
    """
    stmt = (
        select(Patient)
        .options(
            selectinload(Patient.measurements),
            selectinload(Patient.alerts),
            selectinload(Patient.interventions),
            selectinload(Patient.appointments)
        )
        .filter(Patient.id == patient_id)
    )
    res = await db.execute(stmt)
    patient = res.scalars().first()
    if not patient:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")

    measurements = [
        {
            "id": m.id,
            "pef_value": m.pef_value,
            "fev1_value": getattr(m, "fev1_value", None),
            "spo2": getattr(m, "spo2", None),
            "heart_rate": getattr(m, "heart_rate", None),
            "created_at": m.created_at.isoformat() if m.created_at else None
        }
        for m in (patient.measurements or [])
    ]

    interventions = [
        {
            "id": i.id,
            "type": i.intervention_type,
            "description": i.description,
            "recommendations": i.recommendations,
            "created_at": i.created_at.isoformat() if i.created_at else None
        }
        for i in (patient.interventions or [])
    ]

    appts = [
        {
            "id": a.id,
            "date": a.date.isoformat() if a.date else None,
            "type": a.type,
            "status": a.status,
            "notes": a.notes
        }
        for a in (patient.appointments or [])
    ]

    return {
        "generated_at": datetime.utcnow().isoformat(),
        "period": {
            "start": start_date or "2026-01-01",
            "end": end_date or datetime.utcnow().strftime("%Y-%m-%d")
        },
        "doctor": {
            "id": current_user.id,
            "full_name": current_user.full_name,
            "email": current_user.email
        },
        "patient": {
            "id": patient.id,
            "full_name": patient.full_name,
            "email": patient.email,
            "phone": patient.phone,
            "date_of_birth": patient.date_of_birth,
            "risk_level": patient.risk_level,
            "personal_best_pef": patient.personal_best_pef
        },
        "summary": {
            "total_measurements": len(measurements),
            "total_predictions": len(patient.alerts or []),
            "total_interventions": len(interventions),
            "total_appointments": len(appts),
            "latest_risk": patient.risk_level
        },
        "measurements": measurements,
        "predictions": [],
        "interventions": interventions,
        "action_plan": {
            "green_min": round((patient.personal_best_pef or 600) * 0.8),
            "yellow_min": round((patient.personal_best_pef or 600) * 0.5)
        },
        "medications": [],
        "appointments": appts
    }


@router.get("/summary", response_model=dict)
async def get_summary_report(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Obtener reporte consolidado del centro médico / hospital.
    """
    from sqlalchemy import func

    total_patients = (await db.execute(select(func.count()).select_from(Patient))).scalar() or 0
    total_interventions = (await db.execute(select(func.count()).select_from(Intervention))).scalar() or 0
    total_appts = (await db.execute(select(func.count()).select_from(Appointment))).scalar() or 0

    return {
        "generated_at": datetime.utcnow().isoformat(),
        "hospital_name": getattr(current_user, "hospital_name", "AsmaSync Medical Center"),
        "total_patients": total_patients,
        "total_interventions": total_interventions,
        "total_appointments": total_appts,
        "doctor_name": current_user.full_name
    }


@router.get("/patients/{patient_id}/clinical-history/pdf")
async def get_clinical_history_pdf(
    patient_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Response:
    """
    Generates and returns the PDF of the Clinical History for a patient.
    Compliant with NOM-004-SSA3-2012.
    """
    result = await db.execute(select(Patient).filter(Patient.id == patient_id))
    patient = result.scalars().first()
    if not patient:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")

    result = await db.execute(select(ClinicalHistory).filter(ClinicalHistory.patient_id == patient_id))
    history = result.scalars().first()

    result = await db.execute(
        select(PhysicalExam)
        .filter(PhysicalExam.patient_id == patient_id)
        .order_by(PhysicalExam.encounter_date.desc())
        .limit(10)
    )
    exams = result.scalars().all()

    try:
        pdf_bytes = PDFService.generate_clinical_history_pdf(patient, history, exams)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al generar PDF: {str(e)}")

    filename = f"Historia_Clinica_{patient.full_name}_{patient_id}.pdf".replace(" ", "_")
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
