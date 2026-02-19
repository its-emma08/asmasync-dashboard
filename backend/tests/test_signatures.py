import pytest
from datetime import datetime
from app.services.signature_service import SignatureService
from app.models.medical import ClinicalHistory

def test_canonicalization():
    data1 = {"b": 2, "a": 1}
    data2 = {"a": 1, "b": 2}
    
    can1 = SignatureService.canonicalize(data1)
    can2 = SignatureService.canonicalize(data2)
    
    assert can1 == can2
    assert can1 == '{"a":1,"b":2}'

def test_hashing():
    data = {"test": "value"}
    hash_val = SignatureService.generate_hash(data)
    assert len(hash_val) == 64 # SHA-256 hex length

def test_sign_model():
    # Mock model
    history = ClinicalHistory(
        patient_id=1,
        family_history={"diabetes": ["mother"]},
        smoking=False
    )
    # We must ensure signed_at is not included in the hash source if it's None yet, 
    # or if we want to sign the content regardless of the timestamp.
    # The service excludes 'signature' and 'signed_at' by default.
    
    sig = SignatureService.sign_record(history)
    assert len(sig) == 64
    
    # Modify data -> Different hash
    history.smoking = True
    sig2 = SignatureService.sign_record(history)
    assert sig != sig2
