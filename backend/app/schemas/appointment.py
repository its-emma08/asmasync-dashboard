# backend/app/schemas/appointment.py
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class AppointmentBase(BaseModel):
    patient_id: int
    date: datetime
    duration_minutes: Optional[int] = 30
    type: Optional[str] = "checkup"
    status: Optional[str] = "scheduled"
    notes: Optional[str] = None
    location: Optional[str] = None


class AppointmentCreate(AppointmentBase):
    doctor_id: Optional[int] = None  # Inferred from current_user if omitted


class AppointmentUpdate(BaseModel):
    date: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    type: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    location: Optional[str] = None


class AppointmentResponse(AppointmentBase):
    id: int
    doctor_id: int
    patient_name: Optional[str] = None
    doctor_name: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
