from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import joblib
import numpy as np
import pandas as pd
import os
import json
import random
from datetime import datetime, timezone
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.preprocessing import MinMaxScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

from schemas import (
    FeatureInput, PredictionOutput,
    CodeAnalysisInput, CodeAnalysisOutput,
    RetrainRequest, RetrainResponse,
    ModelStatsOutput,
)
from code_analyzer import analyze_code

app = FastAPI(title="AI Coding Behavior ML Service", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── GLOBALS ──────────────────────────────────────────────────────────────────

model        = None
scaler       = None
feature_cols = None

STATS_PATH = "model/training_stats.json"

# All 11 behavioral features (10 original + off_screen_events_count)
ALL_FEATURE_COLS = [
    'typing_speed', 'average_pause_duration', 'paste_ratio',
    'edit_frequency', 'compile_attempts', 'error_frequency',
    'code_growth_rate', 'idle_ratio', 'focus_loss_count',
    'off_screen_events_count', 'backspace_ratio',
]

# Legacy 10-feature list (pre-upgrade model.pkl)
LEGACY_FEATURE_COLS = [
    'typing_speed', 'average_pause_duration', 'paste_ratio',
    'edit_frequency', 'compile_attempts', 'error_frequency',
    'code_growth_rate', 'idle_ratio', 'focus_loss_count',
    'backspace_ratio',
]

# ─── HELPERS ──────────────────────────────────────────────────────────────────

def _load_stats() -> dict:
    if os.path.exists(STATS_PATH):
        with open(STATS_PATH, "r") as f:
            return json.load(f)
    return {
        "last_trained": None,
        "total_samples_used": 0,
        "real_samples": 0,
        "synthetic_samples": 0,
        "accuracy": 0.0,
        "model_type": "Not trained yet",
    }


def _save_stats(stats: dict):
    os.makedirs("model", exist_ok=True)
    with open(STATS_PATH, "w") as f:
        json.dump(stats, f, indent=2)


def _build_feature_vector(features: FeatureInput) -> np.ndarray:
    """Build feature array matching whatever feature_cols the loaded model expects."""
    mapping = {
        'typing_speed':           features.typing_speed,
        'average_pause_duration': features.average_pause_duration,
        'paste_ratio':            features.paste_ratio,
        'edit_frequency':         features.edit_frequency,
        'compile_attempts':       features.compile_attempts,
        'error_frequency':        features.error_frequency,
        'code_growth_rate':       features.code_growth_rate,
        'idle_ratio':             features.idle_ratio,
        'focus_loss_count':       features.focus_loss_count,
        'off_screen_events_count': features.off_screen_events_count,
        'backspace_ratio':        features.backspace_ratio,
    }
    return np.array([[mapping[col] for col in feature_cols]])


def _generate_synthetic_data(n: int) -> pd.DataFrame:
    """Generate a synthetic seed dataset for cold-start / data boosting."""
    random.seed(42)
    np.random.seed(42)
    records = []

    # Genuine (label=2)
    for _ in range(n // 3):
        records.append({
            'typing_speed': random.uniform(2.5, 5.5),
            'average_pause_duration': random.uniform(0.3, 2.5),
            'paste_ratio': random.uniform(0.0, 0.05),
            'edit_frequency': random.uniform(1.5, 5.0),
            'compile_attempts': random.randint(2, 8),
            'error_frequency': random.uniform(0.1, 0.5),
            'code_growth_rate': random.uniform(1.5, 4.0),
            'idle_ratio': random.uniform(0.0, 0.1),
            'focus_loss_count': random.randint(0, 1),
            'off_screen_events_count': random.randint(0, 1),
            'backspace_ratio': random.uniform(0.05, 0.20),
            'label': 2,
        })

    # Review Needed (label=1)
    for _ in range(n // 3):
        records.append({
            'typing_speed': random.uniform(1.0, 4.0),
            'average_pause_duration': random.uniform(2.0, 8.0),
            'paste_ratio': random.uniform(0.05, 0.25),
            'edit_frequency': random.uniform(0.5, 2.5),
            'compile_attempts': random.randint(1, 4),
            'error_frequency': random.uniform(0.3, 0.8),
            'code_growth_rate': random.uniform(0.5, 2.5),
            'idle_ratio': random.uniform(0.1, 0.3),
            'focus_loss_count': random.randint(2, 5),
            'off_screen_events_count': random.randint(1, 4),
            'backspace_ratio': random.uniform(0.2, 0.4),
            'label': 1,
        })

    # Suspicious (label=0)
    for _ in range(n // 3):
        records.append({
            'typing_speed': random.uniform(0.0, 1.5),
            'average_pause_duration': random.uniform(5.0, 30.0),
            'paste_ratio': random.uniform(0.5, 1.0),
            'edit_frequency': random.uniform(0.0, 1.0),
            'compile_attempts': random.randint(0, 2),
            'error_frequency': random.uniform(0.0, 0.3),
            'code_growth_rate': random.uniform(0.0, 1.0),
            'idle_ratio': random.uniform(0.3, 0.9),
            'focus_loss_count': random.randint(5, 20),
            'off_screen_events_count': random.randint(3, 15),
            'backspace_ratio': random.uniform(0.0, 0.05),
            'label': 0,
        })

    return pd.DataFrame(records)


# ─── STARTUP ──────────────────────────────────────────────────────────────────

@app.on_event("startup")
def load_model():
    global model, scaler, feature_cols
    model_path = "model/model.pkl"
    if not os.path.exists(model_path):
        print("[WARN] Model not found. Run: python train.py  OR  retrain via the dashboard.")
        return
    try:
        model  = joblib.load("model/model.pkl")
        scaler = joblib.load("model/scaler.pkl")
        loaded_features = joblib.load("model/features.pkl")

        # Support both legacy 10-feature and new 11-feature models
        if len(loaded_features) == 11:
            feature_cols = ALL_FEATURE_COLS
        else:
            feature_cols = LEGACY_FEATURE_COLS

        print(f"[OK] ML Model loaded ({len(feature_cols)} features) -- {type(model).__name__}")
    except Exception as e:
        print(f"[ERROR] Failed to load model: {e}")


# ─── HEALTH ───────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "OK", "model_loaded": model is not None,
            "features": len(feature_cols) if feature_cols else 0}


# ─── BEHAVIORAL PREDICTION ────────────────────────────────────────────────────

@app.post("/predict", response_model=PredictionOutput)
def predict(features: FeatureInput):
    if model is None:
        raise HTTPException(status_code=503,
                            detail="Model not loaded. Retrain via the dashboard or run train.py.")

    X = _build_feature_vector(features)
    X_scaled    = scaler.transform(X)
    label_idx   = int(model.predict(X_scaled)[0])
    proba       = model.predict_proba(X_scaled)[0]
    confidence  = round(float(max(proba)) * 100, 1)

    label_map = {0: 'Suspicious', 1: 'Review Needed', 2: 'Genuine'}
    classification = label_map[label_idx]

    score_map = {
        2: round(80 + proba[2] * 20),
        1: round(50 + proba[1] * 29),
        0: round(proba[0] * 49),
    }
    authenticity_score = min(100, max(0, score_map[label_idx]))

    # Off-screen penalty (rule-based boost since not all models have this feature)
    off_penalty = min(20, int(features.off_screen_events_count) * 5)
    authenticity_score = max(0, authenticity_score - off_penalty)

    risk_map   = {2: 'Low', 1: 'Medium', 0: 'High'}
    risk_level = risk_map[label_idx]

    # Feature importance
    if hasattr(model, 'feature_importances_'):
        importance = dict(zip(feature_cols, [round(v, 4) for v in model.feature_importances_]))
    else:
        importance = {}

    # Rule-based alerts
    alerts = []
    if features.paste_ratio > 0.4:
        alerts.append({"type": "large_paste", "severity": "high",
                        "message": f"Paste ratio {features.paste_ratio:.1%} indicates heavy copy-paste"})
    if features.idle_ratio > 0.3:
        alerts.append({"type": "excessive_idle", "severity": "medium",
                        "message": f"Idle ratio {features.idle_ratio:.1%} exceeds normal threshold"})
    if features.focus_loss_count > 5:
        alerts.append({"type": "focus_loss", "severity": "medium",
                        "message": f"{int(features.focus_loss_count)} focus loss events detected"})
    if features.typing_speed < 0.5 and features.paste_ratio > 0.3:
        alerts.append({"type": "instant_solution", "severity": "high",
                        "message": "Very low typing speed with high paste ratio suggests pre-written code"})
    if features.off_screen_events_count > 2:
        alerts.append({"type": "off_screen_gaze", "severity": "high",
                        "message": f"Candidate looked away {int(features.off_screen_events_count)} times"})

    return PredictionOutput(
        authenticityScore=authenticity_score,
        classification=classification,
        confidence=confidence,
        riskLevel=risk_level,
        featureImportance=importance,
        alerts=alerts,
    )


# ─── CODE ANALYSIS ────────────────────────────────────────────────────────────

@app.post("/analyze-code", response_model=CodeAnalysisOutput)
def analyze_code_endpoint(body: CodeAnalysisInput):
    """Analyze submitted code quality using AST / regex parsing."""
    result = analyze_code(
        code=body.code,
        language=body.language,
        test_cases_passed=body.test_cases_passed,
        total_test_cases=body.total_test_cases,
    )
    return CodeAnalysisOutput(**result)


# ─── SELF-LEARNING RETRAIN ────────────────────────────────────────────────────

@app.post("/retrain", response_model=RetrainResponse)
def retrain(request: RetrainRequest):
    """
    Retrain the behavioral model with recruiter-labeled real data.
    Mixes real samples with synthetic seed data to avoid overfitting on small sets.
    """
    global model, scaler, feature_cols

    real_count = len(request.samples)

    # Build real DataFrame
    real_records = []
    for s in request.samples:
        real_records.append({
            'typing_speed':           s.typing_speed,
            'average_pause_duration': s.average_pause_duration,
            'paste_ratio':            s.paste_ratio,
            'edit_frequency':         s.edit_frequency,
            'compile_attempts':       s.compile_attempts,
            'error_frequency':        s.error_frequency,
            'code_growth_rate':       s.code_growth_rate,
            'idle_ratio':             s.idle_ratio,
            'focus_loss_count':       s.focus_loss_count,
            'off_screen_events_count': s.off_screen_events_count,
            'backspace_ratio':        s.backspace_ratio,
            'label':                  s.label,
        })

    df_real = pd.DataFrame(real_records) if real_records else pd.DataFrame()

    # Pad with synthetic data
    synthetic_n = request.synthetic_boost if request.include_synthetic else 0
    df_synthetic = _generate_synthetic_data(max(synthetic_n, 300))
    synthetic_count = len(df_synthetic)

    df = pd.concat([df_real, df_synthetic], ignore_index=True).sample(frac=1, random_state=42)

    cols = ALL_FEATURE_COLS
    X = df[cols].values
    y = df['label'].values

    new_scaler = MinMaxScaler()
    X_scaled = new_scaler.fit_transform(X)

    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y, test_size=0.2, random_state=42, stratify=y
    )

    new_model = GradientBoostingClassifier(
        n_estimators=150,
        max_depth=5,
        learning_rate=0.1,
        min_samples_split=5,
        random_state=42,
    )
    new_model.fit(X_train, y_train)

    y_pred   = new_model.predict(X_test)
    accuracy = round(float(accuracy_score(y_test, y_pred)) * 100, 2)

    # Save
    os.makedirs("model", exist_ok=True)
    joblib.dump(new_model, "model/model.pkl")
    joblib.dump(new_scaler, "model/scaler.pkl")
    joblib.dump(cols, "model/features.pkl")

    # Hot-reload
    model        = new_model
    scaler       = new_scaler
    feature_cols = cols

    ts = datetime.now(timezone.utc).isoformat()
    stats = {
        "last_trained":       ts,
        "total_samples_used": len(df),
        "real_samples":       real_count,
        "synthetic_samples":  synthetic_count,
        "accuracy":           accuracy,
        "model_type":         "GradientBoostingClassifier",
    }
    _save_stats(stats)

    print(f"[OK] Model retrained -- {real_count} real + {synthetic_count} synthetic "
          f"samples -- accuracy {accuracy}%")

    return RetrainResponse(
        success=True,
        message=f"Model retrained successfully with {real_count} real + {synthetic_count} synthetic samples.",
        real_samples=real_count,
        synthetic_samples=synthetic_count,
        total_samples=len(df),
        accuracy=accuracy,
        timestamp=ts,
    )


# ─── MODEL STATS ──────────────────────────────────────────────────────────────

@app.get("/model-stats", response_model=ModelStatsOutput)
def model_stats():
    """Return current model metadata and training history."""
    stats = _load_stats()
    return ModelStatsOutput(
        model_loaded=model is not None,
        model_type=stats.get("model_type", type(model).__name__ if model else "Unknown"),
        feature_count=len(feature_cols) if feature_cols else 0,
        feature_names=feature_cols or [],
        last_trained=stats.get("last_trained"),
        total_samples_used=stats.get("total_samples_used", 0),
        real_samples=stats.get("real_samples", 0),
        synthetic_samples=stats.get("synthetic_samples", 0),
        accuracy=stats.get("accuracy", 0.0),
    )
