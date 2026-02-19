import sys
sys.path.append('backend')
from dotenv import load_dotenv
load_dotenv('backend/.env')

import asyncio
import httpx
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import SessionLocal
from app.models.patient import Patient, RiskLevel
from app.models.alert import Alert
from app.models.user import User
from app.core.security import get_password_hash

BASE_URL = "http://127.0.0.1:8001/api/v1"
TEST_EMAIL = "dr_plan_v2@test.com"
TEST_PASS = "securepass123"

async def get_db():
    async with SessionLocal() as session:
        yield session

async def cleanup(email: str):
    async with SessionLocal() as session:
        # Find user
        result = await session.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if user:
            # Delete dependent records manually (if not CASCADE in DB)
            from sqlalchemy import text
            await session.execute(text("DELETE FROM audit_logs WHERE user_id = :uid"), {"uid": user.id})
            await session.execute(text("DELETE FROM doctor_patients WHERE doctor_id = :uid"), {"uid": user.id})
            await session.execute(text("DELETE FROM patients WHERE created_by = :uid"), {"uid": user.id})
            
            # Delete user
            await session.delete(user)
            await session.commit()
            print(f"[INFO] Cleaned up user {email}")

async def run_verification():
    # 1. Register/Login
    async with httpx.AsyncClient() as client:
        # Cleanup first
        await cleanup(TEST_EMAIL)
        
        # Register
        print(f"[INFO] Registering {TEST_EMAIL}...")
        resp = await client.post(f"{BASE_URL}/auth/register", json={
            "email": TEST_EMAIL,
            "password": TEST_PASS,
            "full_name": "Dr. Action Plan",
            "role": "doctor",
            "doctor_code": "DOC-PLAN-001"
        })
        if resp.status_code != 200:
            print(f"[ERROR] Registration failed: {resp.text}")
            return

        # Login
        resp = await client.post(f"{BASE_URL}/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASS
        })
        if resp.status_code != 200:
             print(f"[ERROR] Login failed: {resp.text}")
             return
             
        token = resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("[INFO] Logged in.")

        # 2. Create Patient
        print("[INFO] Creating patient with Personal Best = 500...")
        resp = await client.post(f"{BASE_URL}/patients", json={
            "full_name": "Asthma Patient V2",
            "date_of_birth": "1990-01-01",
            "personal_best_pef": 500,
            "email": "patient_v2@test.com",
            "risk_level": "green"
        }, headers=headers)
        
        if resp.status_code != 200:
            print(f"[ERROR] Failed to create patient (Status {resp.status_code}): {resp.text}")
            return
            
        patient_id = resp.json()["id"]
        print(f"[INFO] Patient created: ID {patient_id}")

        # 3. Test GREEN Zone (PEF=450, 90%)
        print("\n--- Test 1: GREEN Zone (PEF 450) ---")
        resp = await client.post(f"{BASE_URL}/measurements/spirometry", params={"patient_id": patient_id}, json={
            "pef": 450
        }, headers=headers)
        
        if resp.status_code != 200:
            print(f"[ERROR] Green zone submission failed: {resp.text}")
        else:
            data = resp.json()
            if data['zone'] == 'green':
                print("[PASS] Measurement Zone is GREEN.")
            else:
                print(f"[FAIL] Expected GREEN, got {data.get('zone')}")

        # Verify Patient Risk Level (Should be GREEN)
        resp = await client.get(f"{BASE_URL}/patients", headers=headers)
        p_data = [p for p in resp.json()['data'] if p['id'] == patient_id][0]
        if p_data['risk_level'] == 'green':
             print("[PASS] Patient Risk Level updated to GREEN.")
        else:
             print(f"[FAIL] Patient Risk Level = {p_data['risk_level']}")


        # 4. Test YELLOW Zone (PEF=300, 60%)
        print("\n--- Test 2: YELLOW Zone (PEF 300) ---")
        resp = await client.post(f"{BASE_URL}/measurements/spirometry", params={"patient_id": patient_id}, json={
            "pef": 300
        }, headers=headers)
         
        # Verify Risk Level
        resp = await client.get(f"{BASE_URL}/patients", headers=headers)
        p_data = [p for p in resp.json()['data'] if p['id'] == patient_id][0]
        if p_data['risk_level'] == 'yellow':
             print("[PASS] Patient Risk Level updated to YELLOW.")
        else:
             print(f"[FAIL] Expected YELLOW, got {p_data['risk_level']}")


        # 5. Test RED Zone (PEF=100, 20%)
        print("\n--- Test 3: RED Zone (PEF 100) - ALERT GENERATION ---")
        resp = await client.post(f"{BASE_URL}/measurements/spirometry", params={"patient_id": patient_id}, json={
            "pef": 100
        }, headers=headers)

        # Verify Risk Level
        resp = await client.get(f"{BASE_URL}/patients", headers=headers)
        p_data = [p for p in resp.json()['data'] if p['id'] == patient_id][0]
        if p_data['risk_level'] == 'red':
             print("[PASS] Patient Risk Level updated to RED.")
        else:
             print(f"[FAIL] Expected RED, got {p_data['risk_level']}")

        # 6. Verify Alert Creation
        print("\n--- Verifying Alert Logic ---")
        async with SessionLocal() as session:
            result = await session.execute(select(Alert).where(Alert.patient_id == patient_id))
            alerts = result.scalars().all()
            if len(alerts) > 0:
                print(f"[PASS] {len(alerts)} Alert(s) found for patient.")
                print(f"       Alert Message: {alerts[0].message}")
                print(f"       Alert Type: {alerts[0].alert_type}")
            else:
                print("[FAIL] No alerts found for RED zone event.")

if __name__ == "__main__":
    import asyncio
    asyncio.run(run_verification())
