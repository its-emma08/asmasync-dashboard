from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, JSON, Float, Text, Enum, Date
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum

class ConditionStatus(str, enum.Enum):
    ACTIVE = "active"
    RESOLVED = "resolved"
    RECURRENCE = "recurrence"

class AllergySeverity(str, enum.Enum):
    MILD = "mild"
    MODERATE = "moderate"
    SEVERE = "severe"
    ANAPHYLAXIS = "anaphylaxis"

class ClinicalHistory(Base):
    __tablename__ = "clinical_histories"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), unique=True, nullable=False)
    
    # Heredo Familiares (AHF)
    family_history = Column(JSON) # { "diabetes": ["father"], "asthma": ["mother"] }
    
    # Personales No Patológicos (APNP)
    smoking = Column(Boolean, default=False)
    alcoholism = Column(Boolean, default=False)
    physical_activity = Column(String, nullable=True)
    
    # Personales Patológicos (APP)
    surgeries = Column(JSON, nullable=True)
    transfusions = Column(JSON, nullable=True)

    # Signatures
    signature = Column(String, nullable=True) # SHA-256 Hash
    signed_at = Column(DateTime, nullable=True)

    patient = relationship("Patient", back_populates="clinical_history")

class PhysicalExam(Base):
    __tablename__ = "physical_exams"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=False)
    encounter_date = Column(DateTime, nullable=False)
    
    weight_kg = Column(Float, nullable=True)
    height_cm = Column(Float, nullable=True)
    bmi = Column(Float, nullable=True) # Calculated
    
    bp_systolic = Column(Integer, nullable=True)
    bp_diastolic = Column(Integer, nullable=True)
    heart_rate = Column(Integer, nullable=True)
    respiratory_rate = Column(Integer, nullable=True)
    temp_celsius = Column(Float, nullable=True)
    oxygen_saturation = Column(Integer, nullable=True)
    
    notes = Column(Text, nullable=True)

    # Signatures
    signature = Column(String, nullable=True)
    signed_at = Column(DateTime, nullable=True)

    patient = relationship("Patient", back_populates="physical_exams")

class Condition(Base):
    __tablename__ = "conditions"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=False)
    
    code = Column(String, nullable=True) # CIE-10 code
    name = Column(String, nullable=False)
    status = Column(String, default=ConditionStatus.ACTIVE) # Enum as string for simplicity or SQLAlchemy Enum
    diagnosed_at = Column(Date, nullable=True)

    # Signatures
    signature = Column(String, nullable=True)
    signed_at = Column(DateTime, nullable=True)

    patient = relationship("Patient", back_populates="conditions")

class Allergy(Base):
    __tablename__ = "allergies"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=False)
    
    substance = Column(String, nullable=False)
    reaction = Column(String, nullable=True)
    severity = Column(String, default=AllergySeverity.MILD)

    # Signatures
    signature = Column(String, nullable=True)
    signed_at = Column(DateTime, nullable=True)

    patient = relationship("Patient", back_populates="allergies")
