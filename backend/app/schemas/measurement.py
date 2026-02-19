# backend/app/schemas/measurement.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class MeasurementBase(BaseModel):
    measurement_type: str  # pef, spo2, respiratory_rate
    value: float


from pydantic import Field, field_validator

class MeasurementCreate(MeasurementBase):
    patient_id: Optional[int] = None # Inferred from context or explicit
    measured_at: Optional[datetime] = None

class SpirometryCreate(BaseModel):
    pef: int
    fev1: Optional[float] = None
    measured_at: Optional[datetime] = None
    
    @field_validator('pef')
    @classmethod
    def validate_pef(cls, v):
        if v <= 0 or v > 900:
            raise ValueError('PEF debe ser un valor positivo válido (0-900)')
        return v

class Measurement(MeasurementBase):
    id: int
    patient_id: int
    zone: Optional[str] = None
    measured_at: datetime

    class Config:
        from_attributes = True

