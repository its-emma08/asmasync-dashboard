import os
import sys

# Set environment variables BEFORE importing app
os.environ["SECRET_KEY"] = "test_secret_key_123"
# Use an async-compatible URL for the global engine creation to pass
os.environ["DATABASE_URL"] = "postgresql+asyncpg://user:pass@localhost:5432/testdb"
os.environ["REDIS_URL"] = "redis://localhost:6379/0"
os.environ["ENVIRONMENT"] = "testing"

# Mock sys.modules if needed to prevent connection attempts?
# Ideally not needed if we just satisfy config.

# Ensure models are valid and registered for Create All
# This triggers import of config, database, etc.
# Since Env vars are set above, it should work.
from app.models import user, organization, medical, patient

import pytest
