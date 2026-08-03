# backend/app/models/settings.py
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, JSON, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class UserSettingsModel(Base):
    __tablename__ = "user_settings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)

    two_factor = Column(Boolean, default=False)
    push_notifications = Column(Boolean, default=True)
    email_alerts = Column(Boolean, default=False)
    sms_alerts = Column(Boolean, default=False)
    alert_sound = Column(Boolean, default=True)
    critical_only = Column(Boolean, default=False)
    alert_frequency = Column(String, default="realtime")
    privacy_mode = Column(Boolean, default=False)
    auto_lock = Column(Integer, default=15)
    theme = Column(String, default="light")
    compact_mode = Column(Boolean, default=False)
    accent_color = Column(String, default="#3b82f6")

    extra_config = Column(JSON, nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", backref="user_settings_rel")
