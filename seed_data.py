
import asyncio
import sys
import os

# Add backend to sys.path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

# Load .env manually before importing config
env_path = os.path.join(os.getcwd(), 'backend', '.env')
if os.path.exists(env_path):
    print(f"Loading env from {env_path}")
    with open(env_path, 'r') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#'):
                key, _, value = line.partition('=')
                if key and value:
                    os.environ[key.strip()] = value.strip()

from app.core.database import SessionLocal
from app.models.user import User
from app.models.patient import Patient
from app.core import security
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

async def main():
    print("--- AUTOMATED SEEDING SCRIPT ---")
    async with SessionLocal() as db:
        # 1. Fetch Users
        result = await db.execute(select(User).options(selectinload(User.patients)))
        users = result.scalars().all()
        # Convert to list to modify
        users_list = list(users)
        
        print(f"Existing Users: {len(users_list)}")
        
        # 2. Ensure Specific Test Users Exist
        print(">>> Ensuring Test Users (doctor1-3) exist...")
        target_emails = ["doctor1@test.com", "doctor2@test.com", "doctor3@test.com"]
        
        for i, email in enumerate(target_emails, 1):
            # Check if exists
            existing = next((u for u in users_list if u.email == email), None)
            
            if not existing:
                print(f"    Creating {email}...")
                new_user = User(
                    email=email,
                    password_hash=security.get_password_hash("password123"),
                    full_name=f"Dr. Test {i}",
                    role="doctor",
                    doctor_code=f"DOC{i:03d}",
                    is_active=True
                )
                db.add(new_user)
                try:
                    await db.commit()
                    await db.refresh(new_user)
                    
                    # Re-query
                    res = await db.execute(select(User).options(selectinload(User.patients)).filter(User.id == new_user.id))
                    loaded_user = res.scalars().first()
                    users_list.append(loaded_user)
                    print(f"    + Created {email}")
                except Exception as e:
                    print(f"    ! Error creating {email}: {e}")
                    await db.rollback()
            else:
                print(f"    * {email} already exists.")

        # 3. Check/Seed Patients for each Doctor
        print("\n--- USER & PATIENT STATUS ---")
        for user in users_list:
            if user.role != 'doctor':
                continue
                
            print(f"\n[Doctor] {user.full_name} ({user.email})")
            
            # Count patients
            patient_count = len(user.patients)
            print(f"   Patients Linked: {patient_count}")
            
            if patient_count == 0:
                print("   >>> Seeding 3 dummy patients...")
                for j in range(1, 4):
                    p_name = f"Paciente {j} de {user.full_name.split()[1]}"
                    new_patient = Patient(
                        full_name=p_name,
                        date_of_birth="1995-05-20",
                        phone="555-000-0000",
                        email=f"paciente{j}_{user.id}@test.com", # Mock email
                        risk_level=["green", "yellow", "red"][j-1], # Varied risk
                        personal_best_pef=500
                    )
                    db.add(new_patient)
                    await db.flush() # Generate ID
                    
                    # Link to doctor
                    user.patients.append(new_patient)
                    print(f"       + Created {p_name} ({new_patient.risk_level})")
                
                await db.commit()
                print("   >>> Patients seeded successfully.")
                
            else:
                # List existing
                for p in user.patients:
                    print(f"       - {p.full_name} [Risk: {p.risk_level}]")
    
    print("\n--- SEEDING COMPLETE ---")

if __name__ == "__main__":
    asyncio.run(main())
