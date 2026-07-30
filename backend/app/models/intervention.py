# backend/app/models/intervention.py
from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Intervention(Base):
    __tablename__ = "interventions"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    nurse_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    intervention_type = Column(String(50), nullable=False) # counseling, education, plan-adjustment
    description = Column(Text, nullable=False)
    recommendations = Column(Text, nullable=True)
    next_follow_up = Column(Date, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    patient = relationship("Patient", back_populates="interventions")
    nurse = relationship("User")
