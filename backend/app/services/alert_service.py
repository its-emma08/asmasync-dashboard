# backend/app/services/alert_service.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from app.models.alert import Alert
from app.schemas.alert import AlertCreate, AlertUpdate
from typing import List, Tuple, Optional
from datetime import datetime

class AlertService:
    @staticmethod
    async def get_multi(
        db: AsyncSession, 
        skip: int = 0, 
        limit: int = 10,
        is_viewed: Optional[bool] = None
    ) -> Tuple[List[Alert], int]:
        
        query = select(Alert)
        if is_viewed is not None:
            query = query.filter(Alert.is_viewed == is_viewed)
            
        count_query = select(func.count(Alert.id))
        if is_viewed is not None:
             count_query = count_query.filter(Alert.is_viewed == is_viewed)
             
        total = await db.execute(count_query)
        total_count = total.scalar() or 0
        
        query = query.offset(skip).limit(limit).order_by(Alert.created_at.desc())
        result = await db.execute(query)
        
        return result.scalars().all(), total_count

    @staticmethod
    async def get_unread_count(db: AsyncSession) -> int:
        query = select(func.count(Alert.id)).filter(Alert.is_viewed == False)
        result = await db.execute(query)
        return result.scalar() or 0

    @staticmethod
    async def get(db: AsyncSession, id: int) -> Optional[Alert]:
        result = await db.execute(select(Alert).filter(Alert.id == id))
        return result.scalars().first()

    @staticmethod
    async def create(db: AsyncSession, obj_in: AlertCreate) -> Alert:
        db_obj = Alert(
            patient_id=obj_in.patient_id,
            alert_type=obj_in.alert_type,
            message=obj_in.message
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    @staticmethod
    async def mark_as_viewed(db: AsyncSession, alert: Alert, user_id: int) -> Alert:
        alert.is_viewed = True
        alert.viewed_at = datetime.utcnow()
        alert.viewed_by = user_id
        
        db.add(alert)
        await db.commit()
        await db.refresh(alert)
        return alert
