from pydantic import BaseModel
from typing import Optional

class FeatureInput(BaseModel):
    typing_speed: float = 0.0
    average_pause_duration: float = 0.0
    paste_ratio: float = 0.0
    edit_frequency: float = 0.0
    compile_attempts: float = 0.0
    error_frequency: float = 0.0
    code_growth_rate: float = 0.0
    idle_ratio: float = 0.0
    focus_loss_count: float = 0.0
    backspace_ratio: float = 0.0

class PredictionOutput(BaseModel):
    authenticityScore: int
    classification: str
    confidence: float
    riskLevel: str
    featureImportance: dict
    alerts: list
