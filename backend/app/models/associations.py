# backend/app/models/associations.py
from sqlalchemy import Table, Column, Integer, ForeignKey
from app.core.database import Base

doctor_patients = Table(
    'doctor_patients', Base.metadata,
    Column('doctor_id', Integer, ForeignKey('users.id'), primary_key=True),
    Column('patient_id', Integer, ForeignKey('patients.id'), primary_key=True)
)
