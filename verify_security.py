import requests
import json
import random

BASE_URL = "http://localhost:8000/api/v1"

def log(msg, status="INFO"):
    print(f"[{status}] {msg}")

def test_security():
    # 1. Register Doctor
    email = f"dr_secure_{random.randint(1000,9999)}@test.com"
    password = "password123"
    payload = {
        "email": email,
        "password": password,
        "full_name": "Dr Security",
        "role": "doctor",
        "doctor_code": "SEC-007"
    }
    
    log(f"Registering doctor: {email}")
    res = requests.post(f"{BASE_URL}/auth/register", json=payload)
    if res.status_code not in [200, 201]:
        log(f"Registration failed: {res.text}", "ERROR")
        return

    # 2. Login
    log("Logging in...")
    res = requests.post(f"{BASE_URL}/auth/login", json={"email": email, "password": password})
    if res.status_code != 200:
        log(f"Login failed: {res.text}", "ERROR")
        return
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 3. Create Patient
    log("Creating patient...")
    patient_payload = {
        "full_name": "Patient Zero",
        "date_of_birth": "1990-05-20",
        "email": f"patient_{random.randint(1000,9999)}@test.com"
    }
    res = requests.post(f"{BASE_URL}/patients", json=patient_payload, headers=headers)
    if res.status_code != 200:
        log(f"Create patient failed: {res.text}", "ERROR")
        return
    patient_id = res.json()["id"]
    log(f"Patient created with ID: {patient_id}")
    
    # 4. Security Tests
    log("--- STARTING SECURITY TESTS ---")
    
    # Test 4.1: SpO2 > 100
    log("Test 4.1: Sending SpO2 = 200 (Should be 422)")
    res = requests.post(f"{BASE_URL}/measurements/vitals?patient_id={patient_id}", json={"spo2": 200}, headers=headers)
    if res.status_code == 422:
        log("✅ PASSED: Rejected with 422", "SUCCESS")
    else:
        log(f"❌ FAILED: Status {res.status_code}, Response: {res.text}", "FAIL")

    # Test 4.2: SpO2 < 50
    log("Test 4.2: Sending SpO2 = 20 (Should be 422)")
    res = requests.post(f"{BASE_URL}/measurements/vitals?patient_id={patient_id}", json={"spo2": 20}, headers=headers)
    if res.status_code == 422:
        log("✅ PASSED: Rejected with 422", "SUCCESS")
    else:
        log(f"❌ FAILED: Status {res.status_code}", "FAIL")
        
    # Test 4.3: PEF > 900 (User req says le=900)
    log("Test 4.3: Sending PEF = 2000 (Should be 422)")
    res = requests.post(f"{BASE_URL}/measurements/spirometry?patient_id={patient_id}", json={"pef": 2000}, headers=headers)
    if res.status_code == 422:
        log("✅ PASSED: Rejected with 422", "SUCCESS")
    elif res.status_code == 400 or res.status_code == 500:
        log(f"⚠️ AMBIGUOUS: Returned {res.status_code}, expected 422 for Pydantic validation.", "WARN")
    else:
        log(f"❌ FAILED: Status {res.status_code}", "FAIL")

    # Test 4.4: Valid data
    log("Test 4.4: Sending SpO2 = 98 (Should be 200)")
    res = requests.post(f"{BASE_URL}/measurements/vitals?patient_id={patient_id}", json={"spo2": 98, "heart_rate": 70}, headers=headers)
    if res.status_code == 200:
        log("✅ PASSED: Accepted valid data", "SUCCESS")
    else:
        log(f"❌ FAILED: Status {res.status_code} {res.text}", "FAIL")

    # Test 4.5: IDOR (Accessing from another doctor)
    log("Test 4.5: IDOR Check (New Doctor accessing Patient)")
    
    # Register another doctor
    email2 = f"dr_hacker_{random.randint(1000,9999)}@test.com"
    res = requests.post(f"{BASE_URL}/auth/register", json={
        "email": email2,
        "password": password,
        "full_name": "Dr Hacker",
        "role": "doctor",
        "doctor_code": "HACK-000"
    })
    token2_res = requests.post(f"{BASE_URL}/auth/login", json={"email": email2, "password": password})
    if token2_res.status_code == 200:
        token2 = token2_res.json()["access_token"]
        headers2 = {"Authorization": f"Bearer {token2}"}
        
        # Try to post vitals to Patient 1
        res = requests.post(f"{BASE_URL}/measurements/vitals?patient_id={patient_id}", json={"spo2": 95}, headers=headers2)
        if res.status_code == 403:
             log("✅ PASSED: IDOR Blocked (403)", "SUCCESS")
        elif res.status_code == 404:
             log("✅ PASSED: IDOR Blocked (404 Not Found - Stealth Mode)", "SUCCESS")
        else:
             log(f"❌ FAILED: IDOR Succeeded! Status {res.status_code}", "FAIL")
    else:
        log("Skipping IDOR test (Login failed)", "WARN")

if __name__ == "__main__":
    try:
        test_security()
    except Exception as e:
        log(f"Script Error: {e}", "ERROR")
