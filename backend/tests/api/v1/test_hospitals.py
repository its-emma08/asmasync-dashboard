import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.database import Base, get_db
from app.api.deps import get_current_user
from app.models.user import User

# Setup In-Memory DB
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

# Mock User
def override_get_current_user():
    return User(id=1, email="admin@test.com", role="admin")

app.dependency_overrides[get_db] = override_get_db
app.dependency_overrides[get_current_user] = override_get_current_user

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

def test_create_organization():
    response = client.post(
        "/api/v1/organizations",
        json={
            "name": "Test Health Corp",
            "org_type": "hospital",
            "legal_id": "RFC123456",
            "address": "123 Main St",
            "city": "Mexico City",
            "state": "CDMX"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Test Health Corp"
    assert "id" in data

def test_create_hospital():
    # 1. Create Org
    client.post("/api/v1/organizations", json={"name": "Org1", "org_type": "hospital"})
    
    # 2. Create Hospital
    response = client.post(
        "/api/v1/hospitals",
        json={
            "name": "General Hospital",
            "organization_id": 1,
            "hospital_type": "general",
            "accreditation_number": "LIC-999"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "General Hospital"
    assert data["organization_id"] == 1

def test_assign_user_to_hospital():
    # 1. Create Org & Hospital
    client.post("/api/v1/organizations", json={"name": "Org1", "org_type": "hospital"})
    client.post("/api/v1/hospitals", json={"name": "Hosp1", "organization_id": 1, "hospital_type": "general"})
    
    # 2. Create User (Need to insert into DB mostly, but for this specific endpoint, foreign keys usually enforce existence)
    # Since we use SQLite memory, we need a real user in DB for FK constraint
    db = TestingSessionLocal()
    user = User(email="doctor@test.com", password_hash="hash", full_name="Dr Test", role="nurse")
    db.add(user)
    db.commit()
    user_id = user.id
    db.close()

    # 3. Assign
    response = client.post(
        "/api/v1/hospital-assignments",
        json={
            "user_id": user_id,
            "hospital_id": 1,
            "role_in_hospital": "doctor"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["user_id"] == user_id
    assert data["role_in_hospital"] == "doctor"
