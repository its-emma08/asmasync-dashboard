# backend/app/schemas/patient.py
from pydantic import BaseModel, EmailStr, validator
from typing import Optional, List
from datetime import datetime
from app.models.patient import RiskLevel

class PatientBase(BaseModel):
    full_name: str
    email: Optional[EmailStr] = None
    age: int
    gender: Optional[str] = None
    personal_best_pef: Optional[int] = None

    @validator('age')
    def validate_age(cls, v):
        if v < 0 or v > 120:
            raise ValueError('Edad inválida')
        return v

class PatientCreate(PatientBase):
    pass

class PatientUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    age: Optional[int] = None
    personal_best_pef: Optional[int] = None
    risk_level: Optional[RiskLevel] = None

class PatientInDBBase(PatientBase):
    id: int
    risk_level: RiskLevel
    last_crisis_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    created_by: Optional[int] = None

    class Config:
        from_attributes = True

class Patient(PatientInDBBase):
    pass

class PatientListResponse(BaseModel):
    total: int
    page: int
    limit: int
    data: List[Patient]
