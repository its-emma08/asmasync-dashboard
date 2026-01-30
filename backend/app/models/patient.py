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
    age = Column(Integer, nullable=False)
    gender = Column(String(1), nullable=True)  # M, F, O
    
    # Datos Clínicos Base
    personal_best_pef = Column(Integer, nullable=True)
    risk_level = Column(String, default=RiskLevel.GREEN, nullable=False)
    last_crisis_date = Column(DateTime(timezone=True), nullable=True)
    
    # Auditoría
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Relaciones
    measurements = relationship("Measurement", back_populates="patient", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="patient", cascade="all, delete-orphan")
    interventions = relationship("Intervention", back_populates="patient", cascade="all, delete-orphan")
