# backend/app/api/v1/appointments.py
from typing import Any, List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import func

from app.api import deps
from app.models.appointment import Appointment
from app.models.patient import Patient
from app.models.user import User
from app.schemas.appointment import (
    AppointmentCreate,
    AppointmentUpdate,
    AppointmentResponse
)

router = APIRouter()


def _format_appointment(app: Appointment) -> dict:
    return {
        "id": app.id,
        "patient_id": app.patient_id,
        "doctor_id": app.doctor_id,
        "date": app.date,
        "duration_minutes": app.duration_minutes,
        "type": app.type,
        "status": app.status,
        "notes": app.notes,
        "location": app.location,
        "patient_name": app.patient.full_name if app.patient else f"Paciente #{app.patient_id}",
        "doctor_name": app.doctor.full_name if app.doctor else f"Dr. #{app.doctor_id}",
        "created_at": app.created_at,
        "updated_at": app.updated_at,
    }


@router.get("", response_model=dict)
async def list_appointments(
    db: AsyncSession = Depends(deps.get_db),
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    patient_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    List appointments filtered by date range, patient_id or current user (doctor).
    """
    query = select(Appointment).options(
        selectinload(Appointment.patient),
        selectinload(Appointment.doctor)
    )

    # Filter by user role if not superuser
    if not getattr(current_user, "is_superuser", False):
        query = query.filter(
            (Appointment.doctor_id == current_user.id) |
            (Appointment.patient_id == current_user.id)
        )

    if patient_id:
        query = query.filter(Appointment.patient_id == patient_id)
    if start_date:
        query = query.filter(Appointment.date >= start_date)
    if end_date:
        query = query.filter(Appointment.date <= end_date)

    # Total count
    count_stmt = select(func.count()).select_from(query.subquery())
    total_res = await db.execute(count_stmt)
    total = total_res.scalar() or 0

    query = query.order_by(Appointment.date.asc()).offset(skip).limit(limit)
    result = await db.execute(query)
    appts = result.scalars().all()

    formatted = [_format_appointment(a) for a in appts]
    return {"data": formatted, "total": total}


@router.get("/my", response_model=List[dict])
async def get_my_appointments(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Get appointments for current logged in user.
    """
    query = select(Appointment).options(
        selectinload(Appointment.patient),
        selectinload(Appointment.doctor)
    ).filter(
        (Appointment.doctor_id == current_user.id) |
        (Appointment.patient_id == current_user.id)
    ).order_by(Appointment.date.asc())

    result = await db.execute(query)
    appts = result.scalars().all()
    return [_format_appointment(a) for a in appts]


@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_appointment(
    appt_in: AppointmentCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Schedule a new appointment.
    """
    doctor_id = appt_in.doctor_id or current_user.id

    # Verify patient exists
    patient_res = await db.execute(select(Patient).filter(Patient.id == appt_in.patient_id))
    patient = patient_res.scalars().first()
    if not patient:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")

    new_appt = Appointment(
        patient_id=appt_in.patient_id,
        doctor_id=doctor_id,
        date=appt_in.date,
        duration_minutes=appt_in.duration_minutes or 30,
        type=appt_in.type or "checkup",
        status=appt_in.status or "scheduled",
        notes=appt_in.notes,
        location=appt_in.location or "Consultorio Principal"
    )
    db.add(new_appt)
    await db.commit()
    await db.refresh(new_appt)

    # Reload relationships for response
    query = select(Appointment).options(
        selectinload(Appointment.patient),
        selectinload(Appointment.doctor)
    ).filter(Appointment.id == new_appt.id)
    res = await db.execute(query)
    full_appt = res.scalars().first()

    return _format_appointment(full_appt)


@router.get("/{id}", response_model=dict)
async def get_appointment(
    id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    query = select(Appointment).options(
        selectinload(Appointment.patient),
        selectinload(Appointment.doctor)
    ).filter(Appointment.id == id)
    res = await db.execute(query)
    appt = res.scalars().first()
    if not appt:
        raise HTTPException(status_code=404, detail="Cita no encontrada")
    return _format_appointment(appt)


@router.patch("/{id}", response_model=dict)
async def update_appointment(
    id: int,
    appt_in: AppointmentUpdate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    query = select(Appointment).options(
        selectinload(Appointment.patient),
        selectinload(Appointment.doctor)
    ).filter(Appointment.id == id)
    res = await db.execute(query)
    appt = res.scalars().first()
    if not appt:
        raise HTTPException(status_code=404, detail="Cita no encontrada")

    update_data = appt_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(appt, field, val)

    await db.commit()
    await db.refresh(appt)

    # Re-fetch for full properties
    res = await db.execute(query)
    full_appt = res.scalars().first()
    return _format_appointment(full_appt)


@router.delete("/{id}", status_code=status.HTTP_200_OK)
async def delete_appointment(
    id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    query = select(Appointment).filter(Appointment.id == id)
    res = await db.execute(query)
    appt = res.scalars().first()
    if not appt:
        raise HTTPException(status_code=404, detail="Cita no encontrada")

    await db.delete(appt)
    await db.commit()
    return {"message": "Cita eliminada correctamente"}
