import requests
import json

BASE_URL = "http://localhost:8000/api/v1"
ADMIN_EMAIL = "admin@asmasync.com"
ADMIN_PASS = "Admin123!"

def login():
    response = requests.post(
        f"{BASE_URL}/auth/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASS}
    )
    if response.status_code != 200:
        print(f"Login failed: {response.text}")
        return None
    return response.json()["access_token"]

def create_template(token):
    headers = {"Authorization": f"Bearer {token}"}
    data = {
        "title": "Consentimiento Informado General",
        "content": "<h1>Consentimiento</h1><p>Acepto el tratamiento...</p>",
        "version": "1.0",
        "is_active": True
    }
    response = requests.post(f"{BASE_URL}/consents/templates", json=data, headers=headers)
    if response.status_code != 200:
        print(f"Create Template failed: {response.text}")
        return None
    print("✅ Template Created:", response.json()["id"])
    return response.json()["id"]

def assign_consent(token, patient_id, template_id):
    headers = {"Authorization": f"Bearer {token}"}
    data = {
        "patient_id": patient_id,
        "template_id": template_id
    }
    response = requests.post(f"{BASE_URL}/consents/assign", json=data, headers=headers)
    if response.status_code != 200:
        print(f"Assign Consent failed: {response.text}")
        return None
    print("✅ Consent Assigned:", response.json()["id"])
    return response.json()["id"]

def sign_consent(token, consent_id):
    headers = {"Authorization": f"Bearer {token}"}
    data = {
        "signature_blob": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
    }
    response = requests.put(f"{BASE_URL}/consents/sign/{consent_id}", json=data, headers=headers)
    if response.status_code != 200:
        print(f"Sign Consent failed: {response.text}")
        return None
    print("✅ Consent Signed at:", response.json()["signed_at"])
    return response.json()

def get_patient_id(token):
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/patients", headers=headers)
    if response.status_code == 200 and len(response.json()["data"]) > 0:
        return response.json()["data"][0]["id"]
    return None

def main():
    print("🚀 Testing Consent Flow...")
    token = login()
    if not token: return

    # 1. Get a patient
    patient_id = get_patient_id(token)
    if not patient_id:
        print("❌ No patients found. Run seed script first.")
        return
    print(f"ℹ️  Using Patient ID: {patient_id}")

    # 2. Create Template
    template_id = create_template(token)
    if not template_id: return

    # 3. Assign
    consent_id = assign_consent(token, patient_id, template_id)
    if not consent_id: return

    # 4. Sign
    result = sign_consent(token, consent_id)
    if result:
        print("🎉 Consent Flow Verified Successfully!")

if __name__ == "__main__":
    main()
