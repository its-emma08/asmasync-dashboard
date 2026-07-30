# backend/app/services/patient_service.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, case
from app.models.patient import Patient, RiskLevel
from app.models.measurement import Measurement
from app.schemas.patient import PatientCreate, PatientUpdate
from typing import List, Optional, Tuple

class PatientService:
    @staticmethod
    async def get_multi(
        db: AsyncSession, 
        skip: int = 0, 
        limit: int = 10, 
        risk_level: Optional[str] = None,
        search: Optional[str] = None
    ) -> Tuple[List[Patient], int]:
        
        query = select(Patient)
        
        if risk_level and risk_level != 'all':
            query = query.filter(Patient.risk_level == risk_level)
            
        if search:
            query = query.filter(Patient.full_name.ilike(f"%{search}%"))
            
        # Contar total (simplificado, idealmente usar count separado optimizado)
        # Para asyncpg, count(*) puede ser tricky con select(). 
        # Haremos una query separada para count.
        
        count_query = select(func.count(Patient.id))
        if risk_level and risk_level != 'all':
            count_query = count_query.filter(Patient.risk_level == risk_level)
        if search:
            count_query = count_query.filter(Patient.full_name.ilike(f"%{search}%"))
            
        total = await db.execute(count_query)
        total_count = total.scalar() or 0
        
        query = query.offset(skip).limit(limit).order_by(
            case(
                (Patient.risk_level == RiskLevel.RED, 1),
                (Patient.risk_level == RiskLevel.YELLOW, 2),
                (Patient.risk_level == RiskLevel.GREEN, 3),
                else_=4
            ),
            Patient.updated_at.desc()
        )
        
        result = await db.execute(query)
        patients = result.scalars().all()
        
        # Populate current metrics (This is N+1 but acceptable for limit=10)
        for p in patients:
            # Get latest PEF
            pef_res = await db.execute(
                select(Measurement)
                .filter(Measurement.patient_id == p.id, Measurement.measurement_type == 'pef')
                .order_by(Measurement.measured_at.desc())
                .limit(1)
            )
            latest_pef = pef_res.scalars().first()
            if latest_pef:
                p.current_pef = int(latest_pef.value)

            # Get latest SpO2
            spo2_res = await db.execute(
                select(Measurement)
                .filter(Measurement.patient_id == p.id, Measurement.measurement_type == 'spo2')
                .order_by(Measurement.measured_at.desc())
                .limit(1)
            )
            latest_spo2 = spo2_res.scalars().first()
            if latest_spo2:
                p.current_spo2 = int(latest_spo2.value)

        return patients, total_count

    @staticmethod
    async def get(db: AsyncSession, id: int) -> Optional[Patient]:
        result = await db.execute(select(Patient).filter(Patient.id == id))
        return result.scalars().first()

    @staticmethod
    async def create(db: AsyncSession, obj_in: PatientCreate, created_by_id: int) -> Patient:
        db_obj = Patient(
            full_name=obj_in.full_name,
            email=obj_in.email,
            age=obj_in.age,
            gender=obj_in.gender,
            personal_best_pef=obj_in.personal_best_pef,
            created_by=created_by_id
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    @staticmethod
    async def update(db: AsyncSession, db_obj: Patient, obj_in: PatientUpdate) -> Patient:
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj
