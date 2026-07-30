from sqlalchemy import Column, Integer, String, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    org_type = Column(String, nullable=True) # Added for schema compatibility
    tax_id = Column(String, nullable=True) # RFC
    domain = Column(String, nullable=True) # Para login sso
    address = Column(String, nullable=True)
    city = Column(String, nullable=True)
    state = Column(String, nullable=True)

    hospitals = relationship("Hospital", back_populates="organization", cascade="all, delete-orphan")

class Hospital(Base):
    __tablename__ = "hospitals"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey('organizations.id'), nullable=False)
    name = Column(String, nullable=False, index=True)
    license_number = Column(String, nullable=True) # Licencia Sanitaria
    address = Column(JSON, nullable=True)
    settings = Column(JSON, nullable=True) # Config específica (logo, colores)

    organization = relationship("Organization", back_populates="hospitals")
    users = relationship("UserHospitalAssociation", back_populates="hospital")
    patients = relationship("Patient", back_populates="hospital")

class UserHospitalAssociation(Base):
    __tablename__ = "user_hospital_association"

    user_id = Column(Integer, ForeignKey('users.id'), primary_key=True)
    hospital_id = Column(Integer, ForeignKey('hospitals.id'), primary_key=True)
    role_in_hospital = Column(String, nullable=False) # 'medical_director', 'physician', 'resident', 'nurse'

    user = relationship("User", back_populates="hospitals")
    hospital = relationship("Hospital", back_populates="users")
