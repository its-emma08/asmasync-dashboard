import requests
import os

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

def get_patient_id(token):
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/patients", headers=headers)
    if response.status_code == 200 and len(response.json()["data"]) > 0:
        return response.json()["data"][0]["id"]
    return None

def download_pdf(token, patient_id):
    headers = {"Authorization": f"Bearer {token}"}
    url = f"{BASE_URL}/reports/patients/{patient_id}/clinical-history/pdf"
    print(f"⬇️ Downloading PDF from: {url}")
    
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        filename = f"test_report_{patient_id}.pdf"
        with open(filename, "wb") as f:
            f.write(response.content)
        print(f"✅ PDF Downloaded: {filename} ({len(response.content)} bytes)")
        return True
    else:
        print(f"❌ Failed to download PDF: {response.text}")
        return False

def main():
    print("🚀 Testing PDF Report Generation...")
    token = login()
    if not token: return
    
    patient_id = get_patient_id(token)
    if not patient_id:
        print("❌ No patients found.")
        return
        
    download_pdf(token, patient_id)

if __name__ == "__main__":
    main()
