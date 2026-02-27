# backend/app/schemas/user.py
from pydantic import BaseModel, EmailStr, validator
from typing import Optional
from datetime import datetime

# Shared properties
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str = "patient"
    is_active: bool = True
    doctor_code: Optional[str] = None # Nuevo campo

# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str
    specialty: Optional[str] = None
    license_number: Optional[str] = None
    university: Optional[str] = None
    phone: Optional[str] = None
    institution: Optional[str] = None

    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        return v

# Properties to receive via API on update
class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None
    doctor_code: Optional[str] = None
    specialty: Optional[str] = None
    phone: Optional[str] = None

class UserPasswordUpdate(BaseModel):
    current_password: str
    new_password: str

class UserProfileBase(BaseModel):
    asthma_type: Optional[str] = None
    personal_best_pef: Optional[int] = None
    height_cm: Optional[int] = None
    weight_kg: Optional[int] = None
    birth_date: Optional[str] = None
    gender: Optional[str] = None

    class Config:
        from_attributes = True

class UserInDBBase(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime] = None
    is_2fa_enabled: Optional[bool] = False
    
    # Nested Profile
    profile: Optional[UserProfileBase] = None

    class Config:
        from_attributes = True

# Additional properties to return via API
class User(UserInDBBase):
    pass
