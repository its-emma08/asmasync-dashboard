import sys
sys.path.append('backend')
from dotenv import load_dotenv
load_dotenv('backend/.env')
from app.core.database import SessionLocal
from sqlalchemy import text
import asyncio

async def add_column():
    async with SessionLocal() as session:
        try:
            print("Adding is_superuser column to users table...")
            await session.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_superuser BOOLEAN DEFAULT FALSE;"))
            await session.commit()
            print("Column added successfully.")
        except Exception as e:
            print(f"Error adding column: {e}")
            await session.rollback()

if __name__ == "__main__":
    asyncio.run(add_column())
