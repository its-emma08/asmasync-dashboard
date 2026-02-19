import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from datetime import date

from app.main import app
from app.core.database import Base, get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.patient import Patient

# Setup In-Memory DB (Same setup)
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

def override_get_current_user():
    return User(id=1, email="admin@test.com", role="admin")

app.dependency_overrides[get_db] = override_get_db
app.dependency_overrides[get_current_user] = override_get_current_user

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    # Create Dummy Patient
    db = TestingSessionLocal()
    patient = Patient(full_name="John Doe", risk_level="low", age=34)
    db.add(patient)
    db.commit()
    yield
    Base.metadata.drop_all(bind=engine)

def test_create_clinical_history():
    response = client.post(
        "/api/v1/patients/1/clinical-history",
        json={
            "patient_id": 1,
            "family_history": "Father has asthma",
            "hereditary_diseases": {"asthma": ["father"]},
            "smoking": "never",
            "alcohol_consumption": "occasional"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["hereditary_diseases"] == {"asthma": ["father"]}
    assert data["smoking"] == "never"

def test_create_physical_exam():
    response = client.post(
        "/api/v1/patients/1/physical-exams",
        json={
            "patient_id": 1,
            "weight_kg": 70.0,
            "height_cm": 175.0,
            "systolic_bp": 120,
            "diastolic_bp": 80,
            "heart_rate": 72,
            "respiratory_rate": 16,
            "temperature_celsius": 36.5,
            "general_notes": "Healthy"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["bmi"] > 0
    assert abs(data["bmi"] - 22.86) < 0.1

def test_create_condition():
    response = client.post(
        "/api/v1/patients/1/conditions",
        json={
            "patient_id": 1,
            "icd10_code": "J45.9",
            "condition_name": "Asthma",
            "clinical_status": "active",
            "severity": "moderate",
            "onset_date": "2023-01-01"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["icd10_code"] == "J45.9"
    assert data["clinical_status"] == "active"

def test_create_allergy():
    response = client.post(
        "/api/v1/patients/1/allergies",
        json={
            "patient_id": 1,
            "allergen_name": "Peanuts",
            "allergy_type": "food",
            "severity": "severe",
            "reaction": "Anaphylaxis"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["allergen_name"] == "Peanuts"
    assert data["severity"] == "severe"
