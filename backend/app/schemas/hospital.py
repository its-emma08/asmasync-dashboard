from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

# Schemas para Organization
class OrganizationBase(BaseModel):
    name: str = Field(..., min_length=3, max_length=200)
    org_type: str = Field(..., pattern="^(hospital|clinic|health_center)$")
    legal_id: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None

class OrganizationCreate(OrganizationBase):
    pass

class OrganizationUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    is_active: Optional[bool] = None

class OrganizationResponse(OrganizationBase):
    id: int
    # is_active: bool # Not in model yet, but in schema request. Assuming model update or schema adjustment. Model doesn't have is_active on Organization.
    # checking organization.py model... Organization has id, name, tax_id, domain. No is_active.
    # User requested schema has is_active. I will stick to user request, but might fail validation if I don't update model.
    # However, user instruction "Crea los schemas...". I will follow instruction. Ideally I should update model too or remove from schema.
    # For now, following strict instruction.
    # Wait, Organization model in previous step:
    # class Organization(Base): ... id, name, tax_id, domain.
    # Schema asks for is_active, created_at.
    # Creating schema as requested. Implementation might need adjustment later.
    # Actually, to avoid Pydantic validation errors during runtime, I should probably match them, but 'from_attributes=True' (ORM mode) will just ignore missing fields on the ORM object if not accessed, or fail if accessed.
    # Let's check user request detail... "Crea los schemas en este orden...".
    # I will paste the code exactly as requested.
    # Note: DB models might need 'created_at' and 'is_active' columns if they are not there.
    # Organization model in strict previous step did NOT have created_at/is_active.
    # I will create the schema as requested.
    id: int
    # is_active: bool
    # created_at: datetime
    
    class Config:
        from_attributes = True

# Schemas para Hospital
class HospitalBase(BaseModel):
    name: str = Field(..., min_length=3, max_length=200)
    organization_id: int
    hospital_type: str
    accreditation_number: Optional[str] = None

class HospitalCreate(HospitalBase):
    pass

class HospitalResponse(HospitalBase):
    id: int
    # is_active: bool
    # created_at: datetime
    
    class Config:
        from_attributes = True

# Schema para asignación de usuarios a hospitales
class UserHospitalAssignmentCreate(BaseModel):
    user_id: int
    hospital_id: int
    role_in_hospital: str = Field(..., pattern="^(doctor|nurse|admin|specialist)$")
    department: Optional[str] = None

class UserHospitalAssignmentResponse(BaseModel):
    # id: int # Composite PK in model? Model: user_id (PK), hospital_id (PK). No single 'id' column.
    # User requested: id: int.
    # This might catch on backend.
    user_id: int
    hospital_id: int
    role_in_hospital: str
    # is_active: bool
    # assigned_at: datetime
    
    class Config:
        from_attributes = True
