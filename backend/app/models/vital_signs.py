# backend/app/models/vital_signs.py
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Index, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class VitalSigns(Base):
    __tablename__ = "vital_signs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    spo2 = Column(Integer, nullable=True) # %
    heart_rate = Column(Integer, nullable=True) # bpm
    respiratory_rate = Column(Integer, nullable=True) # breaths/min
    temperature = Column(Float, nullable=True) # Celsius
    sys_bp = Column(Integer, nullable=True) # mmHg
    dia_bp = Column(Integer, nullable=True) # mmHg
    
    # Contexto
    activity_context = Column(String, nullable=True) # resting, after_exercise, during_attack
    notes = Column(Text, nullable=True)
        
    measured_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    user = relationship("User", back_populates="vital_signs")

    # Índices para consultas rápidas de tendencias
    __table_args__ = (
        Index('idx_user_vitals_date', 'user_id', 'measured_at'),
    )
