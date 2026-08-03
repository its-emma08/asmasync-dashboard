# backend/app/ml/predict.py
from datetime import datetime
from typing import Dict, Any, List


def predict_crisis_risk(patient_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Algoritmo Determinista basado en Guías GINA (Global Initiative for Asthma).
    Calcula la probabilidad y nivel de riesgo de crisis en 24-72 horas
    basándose en la caída de PEF, saturación SpO2, frecuencia cardíaca e historial.
    """
    recent_pef = patient_data.get("recent_pef", [])
    personal_best = patient_data.get("personal_best_pef") or 500
    if personal_best <= 0:
        personal_best = 500

    current_pef = recent_pef[-1] if recent_pef else patient_data.get("latest_pef", personal_best)
    pef_ratio = min(1.5, max(0.2, current_pef / personal_best))
    pef_percent = round(pef_ratio * 100, 1)

    spo2 = patient_data.get("spo2") or patient_data.get("currentSpO2") or 98
    heart_rate = patient_data.get("heart_rate") or 75
    recent_crisis_days = patient_data.get("days_since_last_crisis")

    factors: List[Dict[str, Any]] = []

    # Base Probability calculation from PEF Ratio
    if pef_ratio < 0.50:
        # Red Zone: Severe Crisis Risk
        base_prob = 0.95 - (pef_ratio * 0.2)
        risk_level = "red"
        factors.append({
            "feature": "pef_critical_drop",
            "importance": 0.50,
            "description": f"Caída crítica de flujo respiratorio ({pef_percent}% del personal best)."
        })
    elif pef_ratio < 0.80:
        # Yellow Zone: Moderate Risk / Partial Control
        base_prob = 0.70 - ((pef_ratio - 0.50) * 1.33)
        risk_level = "yellow"
        factors.append({
            "feature": "pef_moderate_drop",
            "importance": 0.35,
            "description": f"Flujo espiratorio en zona amarilla ({pef_percent}% del personal best)."
        })
    else:
        # Green Zone: Controlled Asthma
        base_prob = max(0.05, 0.25 - ((pef_ratio - 0.80) * 0.8))
        risk_level = "green"

    # SpO2 impact
    if spo2 < 92:
        base_prob = min(0.99, base_prob + 0.15)
        risk_level = "red"
        factors.append({
            "feature": "hypoxia_detected",
            "importance": 0.30,
            "description": f"Saturación de oxígeno crítica (SpO2 {spo2}%)."
        })
    elif spo2 < 95:
        base_prob = min(0.95, base_prob + 0.08)
        if risk_level == "green":
            risk_level = "yellow"
        factors.append({
            "feature": "desaturation_warning",
            "importance": 0.20,
            "description": f"Desaturación leve detectada (SpO2 {spo2}%)."
        })

    # Heart Rate impact
    if heart_rate > 110:
        base_prob = min(0.99, base_prob + 0.05)
        factors.append({
            "feature": "tachycardia",
            "importance": 0.15,
            "description": f"Taquicardia en reposo ({heart_rate} lpm)."
        })

    # Recent crisis history impact
    if recent_crisis_days is not None and recent_crisis_days <= 14:
        base_prob = min(0.99, base_prob + 0.08)
        factors.append({
            "feature": "recent_crisis_history",
            "importance": 0.20,
            "description": f"Crisis reciente hace {recent_crisis_days} días."
        })

    probability = round(min(0.99, max(0.02, base_prob)), 2)

    # Deterministic Confidence based on data completeness
    confidence = 0.90 if len(recent_pef) >= 5 else (0.80 if len(recent_pef) >= 2 else 0.70)

    return {
        "risk_level": risk_level,
        "probability": probability,
        "risk_score": int(probability * 100),
        "confidence": confidence,
        "factors": factors,
        "pef_percent": pef_percent,
        "generated_at": datetime.utcnow().isoformat()
    }
