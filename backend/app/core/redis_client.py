# backend/app/core/redis_client.py
import redis.asyncio as redis
from app.core.config import settings

# Cliente Redis asíncrono
redis_client = redis.from_url(
    settings.REDIS_URL,
    encoding="utf-8",
    decode_responses=True
)

async def get_redis():
    return redis_client
