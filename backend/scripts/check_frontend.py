import requests
import time

def check_frontend():
    url = "http://localhost:4200"
    try:
        response = requests.get(url)
        print(f"Frontend status: {response.status_code}")
        if response.status_code == 200:
            print("✅ Frontend is accessible!")
        else:
            print(f"❌ Frontend returned {response.status_code}")
    except Exception as e:
        print(f"❌ Failed to reach frontend: {e}")

if __name__ == "__main__":
    check_frontend()
