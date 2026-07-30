import hashlib
import json
from datetime import datetime
from typing import Any, Dict

class SignatureService:
    @staticmethod
    def canonicalize(data: Dict[str, Any]) -> str:
        """
        Convert dict to a canonical JSON string (sorted keys, no spaces).
        Handles naive datetimes by assuming UTC or converting strictly.
        """
        def serialize(obj):
            if isinstance(obj, (datetime,)):
                return obj.isoformat()
            raise TypeError(f"Type {type(obj)} not serializable")

        # Sort keys is CRITICAL for consistent hashing
        return json.dumps(data, sort_keys=True, separators=(',', ':'), default=serialize)

    @staticmethod
    def generate_hash(data: Dict[str, Any]) -> str:
        """
        Generate SHA-256 hash of the canonicalized data.
        """
        canonical_str = SignatureService.canonicalize(data)
        return hashlib.sha256(canonical_str.encode('utf-8')).hexdigest()

    @staticmethod
    def sign_record(db_model: Any, exclude_fields: list = None) -> str:
        """
        Helper to sign a SQLAlchemy model instance.
        """
        if exclude_fields is None:
            exclude_fields = ['_sa_instance_state', 'signature', 'signed_at', 'id', 'created_at', 'updated_at']
        
        data = {}
        for key in db_model.__dict__:
            if key not in exclude_fields and not key.startswith('_'):
                data[key] = getattr(db_model, key)
        
        return SignatureService.generate_hash(data)
