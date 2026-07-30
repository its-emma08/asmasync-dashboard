from typing import Optional
from datetime import datetime
from pydantic import BaseModel

# --- Consent Template Schemas ---
class ConsentTemplateBase(BaseModel):
    title: str
    content: str
    version: str = "1.0"
    is_active: bool = True

class ConsentTemplateCreate(ConsentTemplateBase):
    pass

class ConsentTemplateUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    is_active: Optional[bool] = None

class ConsentTemplateResponse(ConsentTemplateBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- Patient Consent Schemas ---
class PatientConsentBase(BaseModel):
    template_id: int
    patient_id: int

class PatientConsentCreate(PatientConsentBase):
    pass

class PatientConsentSign(BaseModel):
    signature_blob: str  # Base64 image or signature data

class PatientConsentResponse(PatientConsentBase):
    id: int
    content_snapshot: str
    status: str
    signed_at: Optional[datetime]
    revoked_at: Optional[datetime]
    signature_blob: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
