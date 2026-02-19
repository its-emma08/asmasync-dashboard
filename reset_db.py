import sys
sys.path.append('backend')
from dotenv import load_dotenv
load_dotenv('backend/.env')

import asyncio
from sqlalchemy import text
from app.core.database import Base, engine
from app.models import * 

async def reset():
    async with engine.begin() as conn:
        print("Dropping legacy tables (CASCADE)...")
        await conn.execute(text("DROP TABLE IF EXISTS exacerbation_history CASCADE"))
        await conn.execute(text("DROP TABLE IF EXISTS readings CASCADE"))
        await conn.execute(text("DROP TABLE IF EXISTS devices CASCADE"))
        await conn.execute(text("DROP TABLE IF EXISTS notifications CASCADE"))
        await conn.execute(text("DROP TABLE IF EXISTS users CASCADE"))
        await conn.execute(text("DROP TABLE IF EXISTS alembic_version CASCADE"))
        
        print("Dropping all remaining tables in metadata...")
        await conn.run_sync(Base.metadata.drop_all)
        print("Tables dropped.")

if __name__ == "__main__":
    if sys.platform == 'win32':
         asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(reset())
