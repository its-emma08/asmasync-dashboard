from typing import List, Any
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.core.database import get_db
from app.api import deps
from app.models.consent import ConsentTemplate, PatientConsent
from app.models.patient import Patient
from app.models.user import User
from app.schemas.consent import (
    ConsentTemplateCreate,
    ConsentTemplateUpdate,
    ConsentTemplateResponse,
    PatientConsentCreate,
    PatientConsentSign,
    PatientConsentResponse
)

router = APIRouter()

# --- Templates Management (Admin/Doctor) ---
@router.post("/templates", response_model=ConsentTemplateResponse)
async def create_template(
    template_in: ConsentTemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Create a new consent template.
    Ref: NOM-004-SSA3-2012 (Informed Consent Standards)
    """
    # TODO: Check if user is admin or authorized
    template = ConsentTemplate(**template_in.model_dump())
    db.add(template)
    await db.commit()
    await db.refresh(template)
    return template

@router.get("/templates", response_model=List[ConsentTemplateResponse])
async def list_templates(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """List all available consent templates."""
    result = await db.execute(select(ConsentTemplate).offset(skip).limit(limit))
    return result.scalars().all()

# --- Patient Consents (Assignment & Signing) ---
@router.post("/assign", response_model=PatientConsentResponse)
async def assign_consent_to_patient(
    assignment: PatientConsentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Assign a specific consent template to a patient.
    Creates a snapshot of the template content at this moment.
    """
    # 1. Verify Patient
    result = await db.execute(select(Patient).filter(Patient.id == assignment.patient_id))
    patient = result.scalars().first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # 2. Verify Template
    result = await db.execute(select(ConsentTemplate).filter(ConsentTemplate.id == assignment.template_id))
    template = result.scalars().first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    # 3. Create Consent Instance (Pending)
    consent = PatientConsent(
        patient_id=assignment.patient_id,
        template_id=assignment.template_id,
        content_snapshot=template.content,
        status="pending"
    )
    db.add(consent)
    await db.commit()
    await db.refresh(consent)
    return consent

@router.put("/sign/{consent_id}", response_model=PatientConsentResponse)
async def sign_consent(
    consent_id: int,
    sign_data: PatientConsentSign,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Sign a pending consent.
    Stores the signature blob and timestamp.
    Ref: NOM-151-SCFI-2016 (Data Conservation & Digital Signatures)
    """
    result = await db.execute(select(PatientConsent).filter(PatientConsent.id == consent_id))
    consent = result.scalars().first()
    
    if not consent:
        raise HTTPException(status_code=404, detail="Consent request not found")
    
    if consent.status == "signed":
        raise HTTPException(status_code=400, detail="Consent already signed")
    
    consent.status = "signed"
    consent.signed_at = datetime.utcnow()
    consent.signature_blob = sign_data.signature_blob
    # In a real app, capture IP and User Agent from Request object
    
    db.add(consent)
    await db.commit()
    await db.refresh(consent)
    return consent

@router.get("/patient/{patient_id}", response_model=List[PatientConsentResponse])
async def list_patient_consents(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """List all consents for a specific patient."""
    result = await db.execute(select(PatientConsent).filter(PatientConsent.patient_id == patient_id))
    return result.scalars().all()
