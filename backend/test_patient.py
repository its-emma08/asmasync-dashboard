import requests
import json

try:
    print("Testing Login...")
    login = requests.post('http://localhost:8000/api/v1/auth/login', 
                          json={'email': 'admin@asmasync.com', 'password': 'Admin123!'})
    if login.status_code != 200:
        print("Login Error:", login.text)
    login.raise_for_status()
    token = login.json().get('access_token')
    print("Login successful. Token acquired.")

    payload = {
        'full_name': 'Test Python', 
        'date_of_birth': '2000-01-01', 
        'gender': 'male', 
        'weight_kg': 70, 
        'height_cm': 170, 
        'email': 'test2@test.com', 
        'asthma_type': 'allergic', 
        'personal_best_pef': 500, 
        'phone': '5512345678'
    }

    print("Testing Patient Creation...")
    res = requests.post('http://localhost:8000/api/v1/patients', 
                        headers={'Authorization': f'Bearer {token}'}, 
                        json=payload)
    
    print(f"Status: {res.status_code}")
    print(json.dumps(res.json(), indent=2))
except Exception as e:
    print(f"Error: {e}")
