# backend/app/models/user.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum

class AsthmaType(str, enum.Enum):
    ALLERGIC = "allergic"
    NON_ALLERGIC = "non_allergic"
    EXERCISE_INDUCED = "exercise_induced"
    OCCUPATIONAL = "occupational"
    UNKNOWN = "unknown"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, default="patient", nullable=False)  # patient, doctor, admin
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False) # [NEW] Added for IDOR checks
    doctor_code = Column(String, nullable=True) # Linked doctor code
    failed_login_attempts = Column(Integer, default=0, nullable=True)
    locked_until = Column(DateTime(timezone=True), nullable=True)
    last_login = Column(DateTime(timezone=True), nullable=True)
    totp_secret = Column(String, nullable=True)
    is_2fa_enabled = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relación 1-to-1 con UserProfile
    profile = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    
    # Otras relaciones (manteniendo compatibilidad si existen)
    hospitals = relationship("UserHospitalAssociation", back_populates="user")
    medical_profile = relationship("MedicalProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    vital_signs = relationship("VitalSigns", back_populates="user", cascade="all, delete-orphan")
    
    # Relación N:M con Pacientes
    patients = relationship("Patient", secondary="doctor_patients", back_populates="doctors")

class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    
    asthma_type = Column(String, default=AsthmaType.UNKNOWN, nullable=True)
    personal_best_pef = Column(Integer, nullable=True)
    height_cm = Column(Integer, nullable=True)
    weight_kg = Column(Integer, nullable=True)
    birth_date = Column(String, nullable=True) # ISO Date
    gender = Column(String(1), nullable=True) # M, F, O

    user = relationship("User", back_populates="profile")

# Mantener MedicalProfile existente para backward compatibility si es necesario
class MedicalProfile(Base):
    __tablename__ = "medical_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    
    professional_license = Column(String, unique=True, index=True, nullable=True)
    specialty = Column(String, nullable=True)
    university = Column(String, nullable=True)
    signature_public_key = Column(String, nullable=True)
    
    user = relationship("User", back_populates="medical_profile")

class PasswordResetCode(Base):
    __tablename__ = "password_reset_codes"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, index=True, nullable=False)
    code = Column(String(6), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
