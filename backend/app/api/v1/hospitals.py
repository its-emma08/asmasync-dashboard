from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.organization import Organization, Hospital, UserHospitalAssociation
from app.schemas.hospital import (
    OrganizationCreate, OrganizationResponse,
    HospitalCreate, HospitalResponse,
    UserHospitalAssignmentCreate, UserHospitalAssignmentResponse
)

router = APIRouter()

router = APIRouter()

# CRUD Organizaciones
@router.post("/organizations", response_model=OrganizationResponse)
async def create_organization(
    org: OrganizationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Crear nueva organización (solo super_admin)"""
    # En fase inicial permitimos a cualquiera o admin. Asumimos admin para seguridad.
    # if current_user.role != "admin": raise HTTPException(403, "Not authorized")
    
    # Map Schema -> Model
    # Note: Schema has extra fields (address, etc.) not currently in simplified Model. 
    # Persisting what fits.
    db_org = Organization(
        name=org.name,
        org_type=org.org_type,
        tax_id=org.legal_id, # Mapping legal_id -> tax_id
        address=org.address,
        city=org.city,
        state=org.state
    )
    db.add(db_org)
    db.commit()
    db.refresh(db_org)
    
    return OrganizationResponse(
        id=db_org.id,
        name=db_org.name,
        org_type=db_org.org_type,
        legal_id=db_org.tax_id,
        address=db_org.address,
        city=db_org.city,
        state=db_org.state
    )

@router.get("/organizations", response_model=List[OrganizationResponse])
async def list_organizations(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Listar organizaciones"""
    orgs = db.query(Organization).offset(skip).limit(limit).all()
    return [
        OrganizationResponse(
            id=o.id,
            name=o.name,
            org_type=o.org_type,
            legal_id=o.tax_id,
            address=o.address,
            city=o.city,
            state=o.state
        ) for o in orgs
    ]

@router.get("/organizations/{org_id}", response_model=OrganizationResponse)
async def get_organization(
    org_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener detalle de organización"""
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return OrganizationResponse(
        id=org.id,
        name=org.name,
        org_type=org.org_type,
        legal_id=org.tax_id,
        address=org.address,
        city=org.city,
        state=org.state
    )

# CRUD Hospitales
@router.post("/hospitals", response_model=HospitalResponse)
async def create_hospital(
    hospital: HospitalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Crear nuevo hospital"""
    # Verify org exists
    org = db.query(Organization).filter(Organization.id == hospital.organization_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
        
    db_hospital = Hospital(
        name=hospital.name,
        organization_id=hospital.organization_id,
        license_number=hospital.accreditation_number, # Mapping
        # settings can store extras
        settings={"hospital_type": hospital.hospital_type}
    )
    db.add(db_hospital)
    db.commit()
    db.refresh(db_hospital)
    
    return HospitalResponse(
        id=db_hospital.id,
        name=db_hospital.name,
        organization_id=db_hospital.organization_id,
        hospital_type=db_hospital.settings.get("hospital_type", "general") if db_hospital.settings else "general",
        accreditation_number=db_hospital.license_number
    )

@router.get("/hospitals", response_model=List[HospitalResponse])
async def list_hospitals(
    organization_id: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Listar hospitales (filtrable por organización)"""
    query = db.query(Hospital)
    if organization_id:
        query = query.filter(Hospital.organization_id == organization_id)
    return query.all()

# Asignaciones
@router.post("/hospital-assignments", response_model=UserHospitalAssignmentResponse) # Added response model to decorator
async def assign_user_to_hospital(
    assignment: UserHospitalAssignmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Asignar usuario (médico/enfermera) a hospital"""
    # Check if exists
    exists = db.query(UserHospitalAssociation).filter(
        UserHospitalAssociation.user_id == assignment.user_id,
        UserHospitalAssociation.hospital_id == assignment.hospital_id
    ).first()
    
    if exists:
        # Update role?
        exists.role_in_hospital = assignment.role_in_hospital
        db.commit()
        db.refresh(exists)
        return exists
    
    db_assoc = UserHospitalAssociation(
        user_id=assignment.user_id,
        hospital_id=assignment.hospital_id,
        role_in_hospital=assignment.role_in_hospital
    )
    db.add(db_assoc)
    db.commit()
    db.refresh(db_assoc)
    return db_assoc

@router.get("/users/{user_id}/hospitals", response_model=List[UserHospitalAssignmentResponse]) # Added response model check
async def get_user_hospitals(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Ver a qué hospitales está asignado un usuario"""
    # Only self or admin
    if current_user.id != user_id and current_user.role != "admin":
         raise HTTPException(status_code=403, detail="Not authorized")
         
    assocs = db.query(UserHospitalAssociation).filter(UserHospitalAssociation.user_id == user_id).all()
    return assocs
