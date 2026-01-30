# backend/app/schemas/intervention.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date

class InterventionBase(BaseModel):
    intervention_type: str
    description: str
    recommendations: Optional[str] = None
    next_follow_up: Optional[date] = None

class InterventionCreate(InterventionBase):
    patient_id: int

class Intervention(InterventionBase):
    id: int
    patient_id: int
    nurse_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
