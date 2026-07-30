# backend/app/ml/features.py
import pandas as pd
import numpy as np

def extract_features(patient_data: dict) -> pd.DataFrame:
    """
    Extrae características del paciente para el modelo ML.
    """
    features = {}
    
    # 1. Tendencia de FEM (Simulada si no hay datos)
    recent_pef = patient_data.get("recent_pef", [])
    if len(recent_pef) >= 2:
        features["pef_mean"] = np.mean(recent_pef)
        features["pef_std"] = np.std(recent_pef)
        features["pef_trend"] = (recent_pef[-1] - recent_pef[0]) / len(recent_pef)
    else:
        features["pef_mean"] = 400
        features["pef_std"] = 0
        features["pef_trend"] = 0
    
    # 2. Porcentaje del mejor personal
    personal_best = patient_data.get("personal_best_pef", 450)
    current_pef = recent_pef[-1] if recent_pef else 400
    features["pef_percent_of_best"] = (current_pef / personal_best) * 100
    
    return pd.DataFrame([features])
