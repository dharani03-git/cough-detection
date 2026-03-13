import os
import numpy as np
import joblib
try:
    import tensorflow as tf
except ImportError:
    tf = None
from preprocessing import load_and_preprocess_audio
from features import get_combined_features, generate_spectrogram_base64, get_xai_saliency
from speech_biomarkers import get_sanitized_biomarkers

# Configuration
MODELS_PATH = "models"
CLASSES = ["Healthy", "Asthma", "Pneumonia"]

def predict_cough(audio_file, model_type="rf", metadata=None):
    """
    Predicts respiratory risk from a cough recording.
    metadata: Dictionary of symptoms like {'fever': 'Yes', 'breathingDifficulty': 'No'}
    """
    if not os.path.exists(audio_file):
        return {"error": f"File {audio_file} not found"}

    # 1. Preprocess
    audio, sr = load_and_preprocess_audio(audio_file)
    if audio is None:
        return {"error": f"Preprocessing failed: {sr}"}

    # 2. Extract and Feature Fusion (Using RF by default as it's more stable for variable length)
    if model_type == "rf":
        model_path = os.path.join(MODELS_PATH, "rf_model.pkl")
        le_path = os.path.join(MODELS_PATH, "label_encoder.pkl")
        
        if not os.path.exists(model_path):
            return {"error": "Model not trained. Run train_model.py first."}
            
        model = joblib.load(model_path)
        le = joblib.load(le_path)
        
        features = get_combined_features(audio, sr).reshape(1, -1)
        
        probs = model.predict_proba(features)[0]
        pred_idx = np.argmax(probs)
        prediction = le.classes_[pred_idx].capitalize()
        confidence = float(probs[pred_idx])
        
    elif model_type == "cnn":
        # Note: CNN implementation would require pad_or_truncate logic here as well
        # For simplicity in this script, we'll focus on RF which uses the 1064-dim vector
        return {"error": "CNN prediction not yet implemented in script (use RF for now)"}
        
    # 3. Clinical Symptom Fusion (Auxiliary Input)
    clinical_adjustment = 0
    if metadata:
        # If symptomatic for fever or dyspnea, increase confidence in pathology
        if metadata.get("fever") == "Yes":
            clinical_adjustment += 0.05
        if metadata.get("breathingDifficulty") == "Yes":
            clinical_adjustment += 0.10
        if metadata.get("chestPain") == "Yes":
            clinical_adjustment += 0.05
            
    # Re-normalize confidence
    confidence = min(1.0, confidence + clinical_adjustment)
    
    # Determine Risk Level
    risk_level = "Low"
    if prediction != "Healthy":
        if confidence > 0.85: risk_level = "Critical"
        elif confidence > 0.70: risk_level = "High"
        else: risk_level = "Medium"
    
    # Uncertainty Estimation (Inverse of confidence but scaled)
    uncertainty = round((1.0 - confidence) * 0.4, 2) # Mock Bayesian uncertainty

    # 4. Enhanced Analytics
    # Spectrogram & XAI
    spectrogram = generate_spectrogram_base64(audio, sr)
    xai_heatmap = get_xai_saliency(audio, sr, target_node=prediction)
    
    # Track B: Speech Biomarkers
    biomarkers = get_sanitized_biomarkers(audio, sr)

    return {
        "prediction": f"{prediction} Risk" if prediction != "Healthy" else "Healthy",
        "confidence": round(confidence, 2),
        "risk_level": risk_level,
        "uncertainty": uncertainty,
        "disclaimer": "This AI tool is for screening or research purposes only and does not replace professional medical diagnosis.",
        "biomarkers": biomarkers,
        "visuals": {
            "spectrogram": spectrogram,
            "xai_heatmap": xai_heatmap
        }
    }

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        file = sys.argv[1]
        result = predict_cough(file)
        print(result)
    else:
        print("Usage: python predict.py <path_to_wav>")
