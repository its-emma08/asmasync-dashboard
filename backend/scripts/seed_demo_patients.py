import asyncio
import sys
import os
from datetime import datetime, timedelta
import random

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from app.core.database import SessionLocal
from app.models.patient import Patient
from app.models.measurement import Measurement

async def create_demo_patients():
    """Crea pacientes de demostración con datos realistas (Async)"""
    async with SessionLocal() as db:
        
        demo_patients = [
            {
                "full_name": "María García López",
                "email": "maria.garcia@example.com",
                "age": 34,
                "gender": "F",
                "personal_best_pef": 450,
                "risk_level": "red",
                "last_crisis_date": datetime.now() - timedelta(days=2)
            },
            {
                "full_name": "Juan Pérez Sánchez",
                "email": "juan.perez@example.com",
                "age": 28,
                "gender": "M",
                "personal_best_pef": 520,
                "risk_level": "yellow",
                "last_crisis_date": datetime.now() - timedelta(days=15)
            },
            {
                "full_name": "Ana Martínez Rodríguez",
                "email": "ana.martinez@example.com",
                "age": 42,
                "gender": "F",
                "personal_best_pef": 420,
                "risk_level": "green",
                "last_crisis_date": datetime.now() - timedelta(days=60)
            },
            {
                "full_name": "Carlos Hernández Torres",
                "email": "carlos.hernandez@example.com",
                "age": 19,
                "gender": "M",
                "personal_best_pef": 580,
                "risk_level": "yellow",
                "last_crisis_date": datetime.now() - timedelta(days=20)
            },
            {
                "full_name": "Laura Ramírez Cruz",
                "email": "laura.ramirez@example.com",
                "age": 55,
                "gender": "F",
                "personal_best_pef": 380,
                "risk_level": "red",
                "last_crisis_date": datetime.now() - timedelta(days=5)
            }
        ]
        
        try:
            for patient_data in demo_patients:
                # Verificar si ya existe
                result = await db.execute(select(Patient).filter(Patient.email == patient_data["email"]))
                existing = result.scalars().first()
                
                if existing:
                    print(f"ℹ️  Paciente {patient_data['full_name']} ya existe")
                    continue
                
                # Crear paciente
                patient = Patient(**patient_data)
                db.add(patient)
                await db.flush()  # Para obtener el ID
                await db.refresh(patient) # Update attributes
                
                # Crear mediciones de los últimos 7 días
                for days_ago in range(7, 0, -1):
                    measurement_date = datetime.now() - timedelta(days=days_ago)
                    
                    # FEM con variación según nivel de riesgo
                    base_pef = patient_data["personal_best_pef"]
                    if patient_data["risk_level"] == "red":
                        pef_value = base_pef * random.uniform(0.50, 0.65)
                        zone = "red"
                    elif patient_data["risk_level"] == "yellow":
                        pef_value = base_pef * random.uniform(0.65, 0.85)
                        zone = "yellow"
                    else:
                        pef_value = base_pef * random.uniform(0.85, 1.00)
                        zone = "green"
                    
                    measurement = Measurement(
                        patient_id=patient.id,
                        measurement_type="pef",
                        value=round(pef_value, 1),
                        measured_at=measurement_date,
                        zone=zone
                    )
                    db.add(measurement)
                
                print(f"✅ Paciente creado: {patient_data['full_name']} (Riesgo: {patient_data['risk_level']})")
            
            await db.commit()
            print("\n" + "="*60)
            print("✅ PACIENTES DE DEMOSTRACIÓN CREADOS")
            print("="*60)
            
        except Exception as e:
            print(f"\n❌ Error: {str(e)}")
            await db.rollback()
            raise

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(create_demo_patients())