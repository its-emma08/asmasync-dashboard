import sys
sys.path.append('backend')
from dotenv import load_dotenv
load_dotenv('backend/.env')

from app.core.database import SessionLocal
from app.models.patient import Patient
from app.models.user import User
from sqlalchemy import select

import asyncio

async def test_insert():
    async with SessionLocal() as session:
        # Find user
        result = await session.execute(select(User).limit(1))
        user = result.scalar_one_or_none()
        if not user:
            print("No user found")
            return

        print(f"User found: {user.id}")
        
        # Create Patient
        p = Patient(
            full_name="Manual Test",
            date_of_birth="2000-01-01",
            risk_level="green",
            created_by=user.id
        )
        session.add(p)
        print("Added to session")
        try:
            await session.flush()
            print(f"Flushed. ID: {p.id}")
            
            # Insert into doctor_patients
            from sqlalchemy import insert
            from app.models.associations import doctor_patients
            stmt = insert(doctor_patients).values(doctor_id=user.id, patient_id=p.id)
            await session.execute(stmt)
            print("Inserted into doctor_patients")

            # Test Schema Validation
            from app.schemas.patient import Patient as PatientSchema
            p_schema = PatientSchema.model_validate(p)
            print("Schema Validation Passed")
            print(p_schema.model_dump())

            await session.rollback()
            print("Rolled back")
        except Exception as e:
            print(f"Error flushing/validating: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_insert())
