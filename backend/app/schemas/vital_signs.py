# backend/app/schemas/vital_signs.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class VitalSignsBase(BaseModel):
    spo2: Optional[int] = None
    heart_rate: Optional[int] = None
    respiratory_rate: Optional[int] = None
    temperature: Optional[float] = None
    sys_bp: Optional[int] = None
    dia_bp: Optional[int] = None
    activity_context: Optional[str] = None
    notes: Optional[str] = None


from pydantic import Field, field_validator

class VitalSignsCreate(VitalSignsBase):
    user_id: Optional[int] = None # Optional if inferred
    measured_at: Optional[datetime] = None

    @field_validator('spo2')
    @classmethod
    def validate_spo2(cls, v):
        if v is not None and (v < 50 or v > 100):
            raise ValueError('SpO2 debe estar entre 50 y 100')
        return v

    @field_validator('heart_rate')
    @classmethod
    def validate_heart_rate(cls, v):
        if v is not None and (v < 30 or v > 250):
            raise ValueError('Frecuencia cardíaca debe estar entre 30 y 250')
        return v

class VitalSigns(VitalSignsBase):
    id: int
    user_id: int
    measured_at: datetime
    
    # Calculate RAG status or similar if needed for frontend display
    
    class Config:
        from_attributes = True

