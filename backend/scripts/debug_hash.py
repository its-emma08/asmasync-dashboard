import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.security import get_password_hash

try:
    print("Testing get_password_hash with 'Admin123!'...")
    hashed = get_password_hash("Admin123!")
    print(f"✅ Success! Hash: {hashed}")
except Exception as e:
    print(f"❌ Failed: {e}")
