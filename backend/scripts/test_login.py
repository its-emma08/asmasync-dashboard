import httpx
import asyncio

async def test_login():
    url = "http://localhost:8000/api/v1/auth/login"
    data = {"email": "admin@asmasync.com", "password": "Admin123!"}
    print(f"Testing login at {url} with {data['email']}...")
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=data)
            print(f"Status: {response.status_code}")
            if response.status_code == 200:
                print("Login successful!")
                print("Token received:", response.json().get("access_token")[:20] + "...")
            else:
                print(f"Login failed: {response.text}")
    except Exception as e:
        print(f"Connection error: {e}")

if __name__ == "__main__":
    asyncio.run(test_login())
