from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import joblib
import numpy as np
import os
from schemas import FeatureInput, PredictionOutput

app = FastAPI(title="AI Coding Behavior ML Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model on startup
model = None
scaler = None
feature_cols = None

@app.on_event("startup")
def load_model():
    global model, scaler, feature_cols
    model_path = "model/model.pkl"
    if not os.path.exists(model_path):
        print("⚠️  Model not found. Run: python train.py")
        return
    model = joblib.load("model/model.pkl")
    scaler = joblib.load("model/scaler.pkl")
    feature_cols = joblib.load("model/features.pkl")
    print("✅ ML Model loaded successfully")

@app.get("/health")
def health():
    return {"status": "OK", "model_loaded": model is not None}

@app.post("/predict", response_model=PredictionOutput)
def predict(features: FeatureInput):
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded. Run python train.py first.")

    # Build feature vector
    X = np.array([[
        features.typing_speed,
        features.average_pause_duration,
        features.paste_ratio,
        features.edit_frequency,
        features.compile_attempts,
        features.error_frequency,
        features.code_growth_rate,
        features.idle_ratio,
        features.focus_loss_count,
        features.backspace_ratio,
    ]])

    X_scaled = scaler.transform(X)
    label_idx = model.predict(X_scaled)[0]
    proba = model.predict_proba(X_scaled)[0]
    confidence = round(float(max(proba)) * 100, 1)

    # Map label to classification, score, risk
    label_map = {0: 'Suspicious', 1: 'Review Needed', 2: 'Genuine'}
    classification = label_map[label_idx]

    # Compute weighted score (0–100)
    score_map = {
        2: round(80 + proba[2] * 20),       # Genuine: 80-100
        1: round(50 + proba[1] * 29),       # Review: 50-79
        0: round(proba[0] * 49),            # Suspicious: 0-49
    }
    authenticity_score = min(100, max(0, score_map[label_idx]))

    risk_map = {2: 'Low', 1: 'Medium', 0: 'High'}
    risk_level = risk_map[label_idx]

    # Feature importance
    importance = dict(zip(feature_cols, [round(v, 4) for v in model.feature_importances_]))

    # Alerts
    alerts = []
    if features.paste_ratio > 0.4:
        alerts.append({"type": "large_paste", "severity": "high", "message": f"Paste ratio {features.paste_ratio:.1%} indicates heavy copy-paste"})
    if features.idle_ratio > 0.3:
        alerts.append({"type": "excessive_idle", "severity": "medium", "message": f"Idle ratio {features.idle_ratio:.1%} exceeds normal threshold"})
    if features.focus_loss_count > 5:
        alerts.append({"type": "focus_loss", "severity": "medium", "message": f"{int(features.focus_loss_count)} focus loss events detected"})
    if features.typing_speed < 0.5 and features.paste_ratio > 0.3:
        alerts.append({"type": "instant_solution", "severity": "high", "message": "Very low typing speed with high paste ratio suggests pre-written code"})

    return PredictionOutput(
        authenticityScore=authenticity_score,
        classification=classification,
        confidence=confidence,
        riskLevel=risk_level,
        featureImportance=importance,
        alerts=alerts,
    )
