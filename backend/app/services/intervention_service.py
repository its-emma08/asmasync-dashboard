# backend/app/services/intervention_service.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.intervention import Intervention
from app.schemas.intervention import InterventionCreate
from typing import List, Optional

class InterventionService:
    @staticmethod
    async def get_by_patient(db: AsyncSession, patient_id: int) -> List[Intervention]:
        result = await db.execute(
            select(Intervention)
            .filter(Intervention.patient_id == patient_id)
            .order_by(Intervention.created_at.desc())
        )
        return result.scalars().all()

    @staticmethod
    async def create(db: AsyncSession, obj_in: InterventionCreate, nurse_id: int) -> Intervention:
        db_obj = Intervention(
            patient_id=obj_in.patient_id,
            nurse_id=nurse_id,
            intervention_type=obj_in.intervention_type,
            description=obj_in.description,
            recommendations=obj_in.recommendations,
            next_follow_up=obj_in.next_follow_up
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj
