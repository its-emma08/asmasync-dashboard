# backend/app/models/patient.py
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum

class RiskLevel(str, enum.Enum):
    GREEN = "green"
    YELLOW = "yellow"
    RED = "red"

class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=True)
    phone = Column(String, nullable=True)  # [NEW]
    
    # Demográficos
    date_of_birth = Column(String, nullable=False)  # ISO Date String YYYY-MM-DD [NEW]
    age = Column(Integer, nullable=True) # DEPRECATED: Calculated from DOB
    gender = Column(String(1), nullable=True)  # M, F, O
    location_city = Column(String, nullable=True) # [NEW]
    
    # Biometría
    height_cm = Column(Integer, nullable=True) # [NEW]
    weight_kg = Column(Integer, nullable=True) # [NEW]

    # Datos Clínicos Base
    asthma_type = Column(String, default="allergic", nullable=True) # [NEW]
    personal_best_pef = Column(Integer, nullable=True)
    risk_level = Column(String, default="green", nullable=False)
    last_crisis_date = Column(DateTime(timezone=True), nullable=True)
    
    # Contacto de Emergencia [NEW]
    emergency_contact_name = Column(String, nullable=True)
    emergency_contact_phone = Column(String, nullable=True)
    emergency_contact_relation = Column(String, nullable=True)
    
    # Auditoría
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"), nullable=True)

    # Relaciones
    hospital = relationship("Hospital", back_populates="patients")
    measurements = relationship("Measurement", back_populates="patient", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="patient", cascade="all, delete-orphan")
    interventions = relationship("Intervention", back_populates="patient", cascade="all, delete-orphan")
    
    # ECE Relationships
    clinical_history = relationship("ClinicalHistory", back_populates="patient", uselist=False, cascade="all, delete-orphan")
    physical_exams = relationship("PhysicalExam", back_populates="patient", cascade="all, delete-orphan")
    conditions = relationship("Condition", back_populates="patient", cascade="all, delete-orphan")
    allergies = relationship("Allergy", back_populates="patient", cascade="all, delete-orphan")
    consents = relationship("PatientConsent", back_populates="patient", cascade="all, delete-orphan")
    
    # Relación N:M con Doctores
    doctors = relationship("User", secondary="doctor_patients", back_populates="patients")
