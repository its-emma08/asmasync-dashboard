from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class ConsentTemplate(Base):
    __tablename__ = "consent_templates"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)  # Contenido en HTML/Markdown
    version = Column(String, nullable=False, default="1.0")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relaciones
    consents = relationship("PatientConsent", back_populates="template")

class PatientConsent(Base):
    __tablename__ = "patient_consents"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    template_id = Column(Integer, ForeignKey("consent_templates.id"), nullable=False)
    
    # Snapshot del contenido al momento de la firma (Requisito legal)
    content_snapshot = Column(Text, nullable=False)
    
    # Estados: pending, signed, revoked
    status = Column(String, default="pending")
    
    # Datos de la Firma (NOM-151)
    signature_blob = Column(Text, nullable=True)  # Base64 data o string hash
    signed_at = Column(DateTime, nullable=True)
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    
    revoked_at = Column(DateTime, nullable=True)
    revocation_reason = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relaciones
    patient = relationship("Patient", back_populates="consents")
    template = relationship("ConsentTemplate", back_populates="consents")
