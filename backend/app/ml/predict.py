# backend/app/ml/predict.py
from datetime import datetime
from app.ml.features import extract_features
import random

# Simulación de modelo cargado
# MODEL_PATH = "app/ml/models/crisis_predictor.pkl"
# model = joblib.load(MODEL_PATH)

def predict_crisis_risk(patient_data: dict) -> dict:
    """
    MOCK: Predice el riesgo de crisis asmática en 24-72 horas.
    Retorna datos simulados basados en reglas simples por ahora.
    """
    
    # Feature engineering (solo para validar que funcione el pipeline)
    # features = extract_features(patient_data)
    
    # Lógica Simulada (Mock)
    # Si PEF actual es muy bajo (<60% del personal best), riesgo algo
    recent_pef = patient_data.get("recent_pef", [])
    personal_best = patient_data.get("personal_best_pef", 450)
    current_pef = recent_pef[-1] if recent_pef else 450
    
    percent = (current_pef / personal_best) * 100
    
    if percent < 60:
        probability = random.uniform(0.75, 0.95)
        risk_level = "red"
        factors = [
            {"feature": "pef_percent_of_best", "importance": 0.45, "description": "FEM muy bajo (<60%)"},
            {"feature": "pef_trend", "importance": 0.30, "description": "Tendencia descendente rápida"}
        ]
    elif percent < 80:
        probability = random.uniform(0.40, 0.70)
        risk_level = "yellow"
        factors = [
            {"feature": "pef_percent_of_best", "importance": 0.40, "description": "FEM bajo (<80%)"},
            {"feature": "weather_humidity", "importance": 0.15, "description": "Humedad alta detectada"}
        ]
    else:
        probability = random.uniform(0.05, 0.30)
        risk_level = "green"
        factors = []

    return {
        "risk_level": risk_level,
        "probability": round(probability, 2),
        "confidence": 0.85, # Mock confidence
        "factors": factors,
        "generated_at": datetime.utcnow().isoformat()
    }
