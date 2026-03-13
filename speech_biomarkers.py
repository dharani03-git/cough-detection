import librosa
import numpy as np
import os

def calculate_speech_biomarkers(audio_signal, sample_rate):
    """
    Calculates key speech biomarkers to estimate respiratory health (FEV1/FVC).
    - F0 (Fundamental Frequency)
    - Jitter (Pitch variation)
    - Shimmer (Amplitude variation)
    - Harmonic-to-Noise Ratio (HNR)
    - Vowel Duration (Strength of breath)
    """
    if audio_signal is None or len(audio_signal) == 0:
        return None

    try:
        # 1. Fundamental Frequency (F0) using Yin algorithm
        f0 = librosa.yin(audio_signal, fmin=librosa.note_to_hz('C2'), fmax=librosa.note_to_hz('C7'), sr=sample_rate)
        f0_mean = np.nanmean(f0)
        
        # 2. Jitter (Local variation in pitch)
        # Simplified: percentage of frame-to-frame F0 change
        f0_diff = np.abs(np.diff(f0))
        jitter = (np.mean(f0_diff) / f0_mean) * 100 if f0_mean > 0 else 0
        
        # 3. Shimmer (Local variation in amplitude)
        # Using peak amplitude per frame
        frames = librosa.util.frame(audio_signal, frame_length=1024, hop_length=512)
        amplitudes = np.max(np.abs(frames), axis=0)
        shimmer = (np.mean(np.abs(np.diff(amplitudes))) / np.mean(amplitudes)) * 100 if np.mean(amplitudes) > 0 else 0
        
        # 4. Harmonic-to-Noise Ratio (HNR) - Approximation
        # High HNR = Healthy vocal folds, Low HNR = Airflow restricted
        autocorr = librosa.autocorrelate(audio_signal)
        hnr = 10 * np.log10(np.max(autocorr) / (np.sum(autocorr) - np.max(autocorr)) + 1e-6)
        
        # 5. Respiratory Score (FEV1/FVC estimation) - Heuristic model
        # Higher Jitter/Shimmer and lower HNR/Duration = Lower Score
        # Max score 100
        duration = len(audio_signal) / sample_rate
        base_score = 100
        penalty = (jitter * 5) + (shimmer * 2) + (20 / (hnr + 1)) + (5 / (duration + 0.1))
        respiratory_score = max(min(base_score - penalty, 100), 0)
        
        # Correlation estimates (mocking R² for demo purposes)
        fev1_fvc_ratio = 0.5 + (respiratory_score / 200) # Mapping 0-100 to 0.5-1.0
        
        return {
            "f0_mean": round(float(f0_mean), 2),
            "jitter": round(float(jitter), 4),
            "shimmer": round(float(shimmer), 4),
            "hnr": round(float(hnr), 2),
            "vowel_duration": round(float(duration), 2),
            "respiratory_score": round(float(respiratory_score), 1),
            "fev1_fvc_ratio": round(float(fev1_fvc_ratio), 2),
            "status": "Healthy" if respiratory_score > 75 else "At Risk" if respiratory_score > 50 else "Critical"
        }
    except Exception as e:
        print(f"Error calculating biomarkers: {e}")
        return None

def sanitize_value(val):
    """Converts NaN/Inf to 0 for JSON compatibility."""
    if val is None: return 0.0
    if np.isnan(val) or np.isinf(val): return 0.0
    return float(val)

def get_sanitized_biomarkers(audio_signal, sample_rate):
    raw = calculate_speech_biomarkers(audio_signal, sample_rate)
    if not raw: return None
    
    return {k: (sanitize_value(v) if isinstance(v, (int, float, np.float32, np.float64)) else v) 
            for k, v in raw.items()}

if __name__ == "__main__":
    # Test with dummy white noise
    sr = 16000
    dummy = np.random.normal(0, 0.1, sr * 3).astype(np.float32)
    # Add a pseudo-sinusoid to mimic voice
    t = np.linspace(0, 3, sr * 3)
    vocal = 0.5 * np.sin(2 * np.pi * 150 * t) 
    test_audio = (vocal + dummy).astype(np.float32)
    
    result = calculate_speech_biomarkers(test_audio, sr)
    print(result)
