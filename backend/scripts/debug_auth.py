import asyncio
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from app.core.database import SessionLocal
from app.models.user import User
from app.core.security import verify_password, get_password_hash

async def debug_auth():
    admin_email = "admin@asmasync.com"
    raw_pass = "Admin123!"
    
    async with SessionLocal() as db:
        result = await db.execute(select(User).filter(User.email == admin_email))
        user = result.scalars().first()
        
        if not user:
            print(f"❌ User {admin_email} NOT FOUND in DB.")
        else:
            print(f"✅ User found: {user.email}")
            print(f"   Stored Hash: {user.password_hash}")
            
            is_valid = verify_password(raw_pass, user.password_hash)
            print(f"   Password '{raw_pass}' valid? {is_valid}")
            
            if not is_valid:
                print("   ⚠️ Password mismatch! Updating...")
                user.password_hash = get_password_hash(raw_pass)
                db.add(user)
                await db.commit()
                print("   ✅ Password updated.")
            else:
                 print("   ✅ Password is correct.")

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(debug_auth())
