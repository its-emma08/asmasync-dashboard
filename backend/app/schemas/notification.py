from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class NotificationResponse(BaseModel):
    id: int
    patient_id: int
    patient_name: str
    alert_type: str  # 'critical', 'moderate'
    message: str
    is_viewed: bool
    created_at: datetime

    class Config:
        from_attributes = True

class NotificationCount(BaseModel):
    count: int
