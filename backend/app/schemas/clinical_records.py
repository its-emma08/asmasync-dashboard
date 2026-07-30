from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime, date

# Historia Clínica
class ClinicalHistoryBase(BaseModel):
    patient_id: int
    hereditary_diseases: Optional[Dict[str, Any]] = None
    family_history: Optional[str] = None
    previous_diseases: Optional[Dict[str, Any]] = None
    hospitalizations_history: Optional[List[Dict[str, Any]]] = None
    surgeries_history: Optional[List[Dict[str, Any]]] = None
    smoking: Optional[str] = Field(None, pattern="^(never|former|current)$")
    alcohol_consumption: Optional[str] = None

class ClinicalHistoryCreate(ClinicalHistoryBase):
    pass

class ClinicalHistoryUpdate(BaseModel):
    hereditary_diseases: Optional[Dict[str, Any]] = None
    family_history: Optional[str] = None
    smoking: Optional[str] = None

class ClinicalHistoryResponse(ClinicalHistoryBase):
    id: int
    # created_at: datetime
    # updated_at: datetime
    
    class Config:
        from_attributes = True

# Examen Físico
class PhysicalExamBase(BaseModel):
    patient_id: int
    systolic_bp: Optional[int] = Field(None, ge=60, le=250)
    diastolic_bp: Optional[int] = Field(None, ge=40, le=150)
    heart_rate: Optional[int] = Field(None, ge=30, le=220)
    respiratory_rate: Optional[int] = Field(None, ge=8, le=60)
    temperature_celsius: Optional[float] = Field(None, ge=35.0, le=42.0)
    weight_kg: Optional[float] = Field(None, ge=0.5, le=300.0)
    height_cm: Optional[float] = Field(None, ge=30.0, le=250.0)
    general_notes: Optional[str] = None

class PhysicalExamCreate(PhysicalExamBase):
    pass

class PhysicalExamResponse(PhysicalExamBase):
    id: int
    bmi: Optional[float] = None
    exam_date: datetime
    # examined_by: int
    
    class Config:
        from_attributes = True

# Diagnósticos (Conditions)
class ConditionBase(BaseModel):
    patient_id: int
    icd10_code: str = Field(..., max_length=10)
    condition_name: str = Field(..., max_length=200)
    clinical_status: str = Field(..., pattern="^(active|resolved|inactive)$")
    severity: Optional[str] = Field(None, pattern="^(mild|moderate|severe)$")
    onset_date: Optional[date] = None
    notes: Optional[str] = None

class ConditionCreate(ConditionBase):
    pass

class ConditionUpdate(BaseModel):
    clinical_status: Optional[str] = None
    severity: Optional[str] = None
    notes: Optional[str] = None

class ConditionResponse(ConditionBase):
    id: int
    # diagnosed_by: int
    diagnosed_at: Optional[date] # Model has diagnosed_at as Date
    
    class Config:
        from_attributes = True

# Alergias
class AllergyBase(BaseModel):
    patient_id: int
    allergen_name: str = Field(..., max_length=200)
    allergy_type: str = Field(..., pattern="^(medication|food|environmental|other)$")
    severity: str = Field(..., pattern="^(mild|moderate|severe|life_threatening|anaphylaxis)$") # Updated pattern to include anaphylaxis from model enum
    reaction: Optional[str] = None

class AllergyCreate(AllergyBase):
    pass

class AllergyResponse(AllergyBase):
    id: int
    # recorded_by: int
    # recorded_at: datetime
    
    class Config:
        from_attributes = True
