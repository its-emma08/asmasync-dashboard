# backend/app/schemas/measurement.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class MeasurementBase(BaseModel):
    measurement_type: str  # pef, spo2, respiratory_rate
    value: float

class MeasurementCreate(MeasurementBase):
    patient_id: int
    measured_at: Optional[datetime] = None

class Measurement(MeasurementBase):
    id: int
    patient_id: int
    zone: Optional[str] = None
    measured_at: datetime

    class Config:
        from_attributes = True
