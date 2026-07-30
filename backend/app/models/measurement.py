# backend/app/models/measurement.py
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Measurement(Base):
    __tablename__ = "measurements"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    
    measurement_type = Column(String(20), nullable=False)  # pef, spo2, respiratory_rate
    value = Column(Float, nullable=False)
    zone = Column(String(10), nullable=True)  # green, yellow, red
    
    measured_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    patient = relationship("Patient", back_populates="measurements")

    # Índices compuestos para consultas rápidas de históricos
    __table_args__ = (
        Index('idx_patient_measurements', 'patient_id', 'measured_at'),
    )
