import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import MinMaxScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import joblib
import os
import random

random.seed(42)
np.random.seed(42)

def generate_dataset(n=2000):
    """Generate synthetic behavioral dataset for training."""
    records = []

    # Genuine candidates (label=2, score=80-100)
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
            'backspace_ratio': random.uniform(0.05, 0.20),
            'label': 2  # Genuine
        })

    # Review Needed (label=1, score=50-79)
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
            'backspace_ratio': random.uniform(0.2, 0.4),
            'label': 1  # Review Needed
        })

    # Suspicious (label=0, score=0-49)
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
            'backspace_ratio': random.uniform(0.0, 0.05),
            'label': 0  # Suspicious
        })

    return pd.DataFrame(records)

def train():
    print("📊 Generating synthetic dataset...")
    df = generate_dataset(3000)

    feature_cols = [
        'typing_speed', 'average_pause_duration', 'paste_ratio',
        'edit_frequency', 'compile_attempts', 'error_frequency',
        'code_growth_rate', 'idle_ratio', 'focus_loss_count', 'backspace_ratio'
    ]

    X = df[feature_cols]
    y = df['label']

    # Scale features
    scaler = MinMaxScaler()
    X_scaled = scaler.fit_transform(X)

    # Train/test split
    X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.2, random_state=42)

    # Train Random Forest
    print("🌲 Training Random Forest Classifier...")
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        min_samples_split=5,
        random_state=42,
        class_weight='balanced'
    )
    model.fit(X_train, y_train)

    # Evaluate
    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"✅ Model Accuracy: {acc * 100:.2f}%")
    print(classification_report(y_test, y_pred, target_names=['Suspicious', 'Review Needed', 'Genuine']))

    # Save model and scaler
    os.makedirs('model', exist_ok=True)
    joblib.dump(model, 'model/model.pkl')
    joblib.dump(scaler, 'model/scaler.pkl')
    joblib.dump(feature_cols, 'model/features.pkl')
    print("💾 Model saved to model/model.pkl")

if __name__ == '__main__':
    train()
