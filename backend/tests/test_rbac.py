import pytest
from app.models.user import User, MedicalProfile
from app.models.organization import UserHospitalAssociation

# Since we can't easily query the async DB in this synchronous test suite without 
# creating a complex async fixture loop (which we avoided in conftest.py by using creating synchronous loop or sticking to unit logic),
# We will verify the RELATIONSHIP logic and Model instantiation here.

def test_medical_profile_relationship():
    u = User(id=1, email="doc@test.com", full_name="Dr. House")
    p = MedicalProfile(user_id=1, professional_license="12345", specialty="Diagnostic")
    u.medical_profile = p
    
    assert u.medical_profile.specialty == "Diagnostic"
    assert u.medical_profile.professional_license == "12345"

def test_hospital_association_permissions():
    u = User(id=1, full_name="Nurse Joy")
    # Simulate association
    assoc = UserHospitalAssociation(user_id=1, hospital_id=10, role_in_hospital="nurse")
    u.hospitals.append(assoc)
    
    assert len(u.hospitals) == 1
    assert u.hospitals[0].role_in_hospital == "nurse"
