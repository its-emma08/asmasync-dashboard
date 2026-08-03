# backend/app/models/device.py
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class IoTDeviceModel(Base):
    __tablename__ = "iot_devices"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=True)

    device_type = Column(String, nullable=False)  # spirometer, smartwatch, sensor, inhaler_tracker
    device_brand = Column(String, nullable=True)
    device_model = Column(String, nullable=True)
    serial_number = Column(String, nullable=True, unique=True)
    is_active = Column(Boolean, default=True)
    battery_level = Column(Integer, default=100)
    last_sync = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", backref="iot_devices")
    patient = relationship("Patient", backref="iot_devices")
