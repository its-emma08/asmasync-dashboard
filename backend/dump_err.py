import requests
try:
    token = requests.post('http://localhost:8000/api/v1/auth/login', json={"email": "admin@asmasync.com", "password": "Admin123!"}).json().get("access_token")
    res = requests.post('http://localhost:8000/api/v1/patients', headers={'Authorization': f'Bearer {token}'}, json={'full_name': 'Test Python', 'date_of_birth': '2000-01-01', 'gender': 'male', 'weight_kg': 70, 'height_cm': 170, 'email': 'test2@test.com', 'asthma_type': 'allergic', 'personal_best_pef': 500, 'phone': '5512345678'})
    with open('err.txt', 'w') as f:
        f.write(str(res.json()))
except Exception as e:
    pass
