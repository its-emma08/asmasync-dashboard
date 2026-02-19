import urllib.request
import urllib.parse
import json
import sys
import time

BASE_URL = "http://localhost:8001/api/v1"

# Use a unique email to avoid conflicts if cleanup fails
TIMESTAMP = int(time.time())
EMAIL = f"dr.notify_{TIMESTAMP}@test.com"
PASSWORD = "securepassword123"

def make_request(url, method="GET", data=None, headers=None):
    if headers is None:
        headers = {}
    
    if data:
        if headers.get("Content-Type") == "application/json":
            # Data is already bytes or string, just ensure bytes
            if isinstance(data, str):
                data = data.encode('utf-8')
        else:
            # Default form encoding
            data = urllib.parse.urlencode(data).encode('utf-8')
    
    req = urllib.request.Request(url, data=data, method=method, headers=headers)
    
    try:
        with urllib.request.urlopen(req) as response:
            if response.status not in [200, 201]:
                 print(f"Request failed: {response.status} {response.read().decode()}")
                 sys.exit(1)
            # Handle empty response (e.g. 204)
            if response.status == 204:
                return {}
            content = response.read().decode()
            if content:
                return json.loads(content)
            return {}
    except urllib.error.HTTPError as e:
        print(f"HTTP Error: {e.code} {e.read().decode()}")
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

def register():
    print(f"Registering {EMAIL}...")
    headers = {"Content-Type": "application/json"}
    payload = {
        "email": EMAIL,
        "password": PASSWORD,
        "full_name": "Dr. Notification",
        "role": "doctor",
        "doctor_code": f"DOC-{TIMESTAMP}"
    }
    data = json.dumps(payload)
    make_request(f"{BASE_URL}/auth/register", method="POST", data=data, headers=headers)
    print("Registration successful.")

def login():
    print(f"Logging in as {EMAIL}...")
    headers = {"Content-Type": "application/json"}
    data = json.dumps({"email": EMAIL, "password": PASSWORD})
    resp = make_request(f"{BASE_URL}/auth/login", method="POST", data=data, headers=headers)
    return resp["access_token"]

def create_patient(token):
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    payload = {
        "full_name": "Notify Patient",
        "date_of_birth": "1990-01-01",
        "personal_best_pef": 500,
        "risk_level": "green"
    }
    print("Creating test patient...")
    resp = make_request(f"{BASE_URL}/patients", method="POST", data=json.dumps(payload), headers=headers)
    return resp

def get_patients(token):
    headers = {"Authorization": f"Bearer {token}"}
    resp = make_request(f"{BASE_URL}/patients", headers=headers)
    return resp["data"]

def create_test_alert(token, patient_id):
    print(f"Creating test alert for patient ID {patient_id}...")
    headers = {"Authorization": f"Bearer {token}"}
    # For POST with params in URL
    url = f"{BASE_URL}/alerts/test?patient_id={patient_id}&type=critical"
    # Empty body for POST
    req = urllib.request.Request(url, method="POST", headers=headers)
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode())
    except urllib.error.HTTPError as e:
        print(f"HTTP Error creating alert: {e.code} {e.read().decode()}")
        sys.exit(1)

def get_notifications(token):
    print("Fetching notifications...")
    headers = {"Authorization": f"Bearer {token}"}
    return make_request(f"{BASE_URL}/alerts?limit=5", headers=headers)

def get_unread_count(token):
    headers = {"Authorization": f"Bearer {token}"}
    resp = make_request(f"{BASE_URL}/alerts/unread-count", headers=headers)
    return resp["count"]

def mark_read(token, alert_id):
    print(f"Marking alert {alert_id} as read...")
    headers = {"Authorization": f"Bearer {token}"}
    make_request(f"{BASE_URL}/alerts/{alert_id}/mark-read", method="PATCH", headers=headers)
    print("Alert marked as read.")

def main():
    register()
    token = login()
    
    patient = create_patient(token)
    print(f"Patient created: {patient['id']}")
    
    # 1. Check initial count
    initial_count = get_unread_count(token)
    print(f"Initial unread count: {initial_count}")
    
    # 2. Create Alert
    new_alert = create_test_alert(token, patient["id"])
    alert_id = new_alert["id"]
    
    # 3. Verify count increased
    count_after_create = get_unread_count(token)
    print(f"Count after create: {count_after_create}")
    # Note: If initial was 0, now it should be 1. If strict > logic:
    if count_after_create <= initial_count:
        print("ERROR: Count did not increase!")
    
    # 4. Verify list contains alert
    alerts = get_notifications(token)
    found = any(a["id"] == alert_id for a in alerts)
    if not found:
        print("ERROR: New alert not found in list!")
    else:
        print("Alert verified in list.")
        
    # 5. Mark as read
    mark_read(token, alert_id)
    
    # 6. Verify count decreased
    final_count = get_unread_count(token)
    print(f"Final count: {final_count}")
    
    if final_count >= count_after_create:
         print("ERROR: Count did not decrease!")
    else:
        print("SUCCESS: Full notification cycle verified.")

def main():
    register()
    token = login()
    
    patient = create_patient(token)
    patient_id = patient['id']
    print(f"Patient created: {patient_id}")
    
    # Debug: Verify patient exists in list
    all_patients = get_patients(token)
    found = any(p['id'] == patient_id for p in all_patients)
    if found:
        print(f"DEBUG: Patient {patient_id} found in doctor's list.")
    else:
        print(f"DEBUG: Patient {patient_id} NOT found in doctor's list post-creation!")
        sys.exit(1)
    
    # 1. Check initial count
    initial_count = get_unread_count(token)
    print(f"Initial unread count: {initial_count}")
    
    # 2. Create Alert
    new_alert = create_test_alert(token, patient_id)
    alert_id = new_alert["id"]
    
    # 3. Verify count increased
    count_after_create = get_unread_count(token)
    print(f"Count after create: {count_after_create}")
    # Note: If initial was 0, now it should be 1. If strict > logic:
    if count_after_create <= initial_count:
        print("ERROR: Count did not increase!")
    
    # 4. Verify list contains alert
    alerts = get_notifications(token)
    print(f"DEBUG: Alerts retrieved: {[a['id'] for a in alerts]}")
    found = any(a["id"] == alert_id for a in alerts)
    if not found:
        print("ERROR: New alert not found in list!")
    else:
        print("Alert verified in list.")
        
    # 5. Mark as read
    mark_read(token, alert_id)
    
    # 6. Verify count decreased
    final_count = get_unread_count(token)
    print(f"Final count: {final_count}")
    
    if final_count >= count_after_create:
         print("ERROR: Count did not decrease!")
    else:
        print("SUCCESS: Full notification cycle verified.")

if __name__ == "__main__":
    main()
