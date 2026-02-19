# backend/app/schemas/patient.py
from pydantic import BaseModel, EmailStr, validator
from typing import Optional, List
from datetime import datetime
from app.models.patient import RiskLevel

class PatientBase(BaseModel):
    full_name: str
    email: Optional[EmailStr] = None
    date_of_birth: str # YYYY-MM-DD
    phone: Optional[str] = None
    age: Optional[int] = None # Optional now
    gender: Optional[str] = None
    
    height_cm: Optional[int] = None
    weight_kg: Optional[int] = None
    asthma_type: Optional[str] = "allergic"

    personal_best_pef: Optional[int] = None
    
    # Emergency Contact
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    emergency_contact_relation: Optional[str] = None
    
    # Medical Data
    diagnosis_date: Optional[str] = None # YYYY-MM-DD

class PatientCreate(PatientBase):
    pass

class PatientUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    date_of_birth: Optional[str] = None
    age: Optional[int] = None
    
    height_cm: Optional[int] = None
    weight_kg: Optional[int] = None
    asthma_type: Optional[str] = None

    personal_best_pef: Optional[int] = None
    risk_level: Optional[RiskLevel] = None
    
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    emergency_contact_relation: Optional[str] = None

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
    current_pef: Optional[int] = None
    current_spo2: Optional[int] = None
    pass

class PatientListResponse(BaseModel):
    total: int
    page: int
    limit: int
    data: List[Patient]
