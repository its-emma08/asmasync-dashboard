import sys
sys.path.append('backend')

from dotenv import load_dotenv
import os
load_dotenv('backend/.env')

import asyncio
from sqlalchemy import text
from app.core.database import SessionLocal, engine

async def inspect():
    async with SessionLocal() as session:
        print("INSPECTING USERS TABLE COLUMNS:")
        result = await session.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users';"))
        for row in result:
            print(f"- {row[0]} ({row[1]})")

if __name__ == "__main__":
    try:
        if sys.platform == 'win32':
             asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
        asyncio.run(inspect())
    except Exception as e:
        print(e)
