# backend/app/schemas/alert.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AlertBase(BaseModel):
    alert_type: str  # critical, moderate
    message: str

class AlertCreate(AlertBase):
    patient_id: int

class AlertUpdate(BaseModel):
    is_viewed: bool

class Alert(AlertBase):
    id: int
    patient_id: int
    is_viewed: bool
    created_at: datetime
    viewed_at: Optional[datetime] = None
    viewed_by: Optional[int] = None

    class Config:
        from_attributes = True
