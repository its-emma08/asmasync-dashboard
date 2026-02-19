import asyncio
import sys
import os

# Add parent directory to path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash
from sqlalchemy.future import select

async def seed_db():
    async with SessionLocal() as session:
        print("Checking for existing users...")
        result = await session.execute(select(User).filter(User.email == "admin@asmasync.com"))
        user = result.scalars().first()
        
        if not user:
            print("Creating admin user...")
            admin_user = User(
                email="admin@asmasync.com",
                password_hash=get_password_hash("Admin123!"),
                full_name="System Admin",
                role="admin",
                is_active=True
            )
            session.add(admin_user)
            await session.commit()
            print("Admin user created successfully.")
        else:
            print("Admin user already exists.")
            # Optional: Reset password if needed, but for now just skip
            pass

if __name__ == "__main__":
    asyncio.run(seed_db())
