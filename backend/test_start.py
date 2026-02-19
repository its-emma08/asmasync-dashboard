import sys
print(sys.executable)
try:
    from fastapi import FastAPI
    import uvicorn
    from app.main import app
    print("Imports successful")
except Exception as e:
    print(f"Error: {e}")
