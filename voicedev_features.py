import librosa
import numpy as np
from scipy.signal import find_peaks

def extract_pitch(y, sr):
    """Extract fundamental frequency (F0) using pYIN."""
    f0, voiced_flag, voiced_probs = librosa.pyin(y, fmin=librosa.note_to_hz('C2'), fmax=librosa.note_to_hz('C7'))
    # Filter out NaNs and compute mean pitch of voiced parts
    voiced_f0 = f0[~np.isnan(f0)]
    if len(voiced_f0) == 0:
        return 0
    return float(np.mean(voiced_f0))

def extract_jitter_shimmer(y, sr):
    """
    Approximate Jitter and Shimmer from a voiced segment.
    """
    # Find peaks representing the glottal pulses (periodicity)
    # Pitch for children is usually higher, so we look for peaks close together
    # For a high pitch of 300Hz, period is ~3ms (at 16k sr, ~50 samples)
    peaks, _ = find_peaks(y, distance=sr//500) # distance approx 2ms
    
    if len(peaks) < 10:
        return 0, 0
    
    # Fundamental periods (in samples)
    periods = np.diff(peaks)
    
    # Jitter (local)
    jitter = np.mean(np.abs(np.diff(periods))) / np.mean(periods)
    
    # Peak amplitudes
    amplitudes = np.abs(y[peaks])
    
    # Shimmer (local)
    shimmer = np.mean(np.abs(np.diff(amplitudes))) / np.mean(amplitudes)
    
    return float(jitter), float(shimmer)

def analyze_voice_dev(audio_path):
    """
    Analyzes the voice for development metrics.
    """
    try:
        y, sr = librosa.load(audio_path, sr=None)
        
        # 1. Pitch
        pitch = extract_pitch(y, sr)
        
        # 2. MFCC
        mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
        mfcc_mean = np.mean(mfccs, axis=1).tolist()
        
        # 3. Spectral Energy
        spectral_energy = float(np.sum(y**2))
        
        # 4. Jitter & Shimmer
        jitter, shimmer = extract_jitter_shimmer(y, sr)
        
        # Step 3 - Classification logic (Mock/Simplified)
        # Pediatric voice characteristics:
        # Deep: Low pitch (< 200 Hz for children)
        # Feeble: Low energy, high jitter/shimmer
        # Coarse: High shimmer/jitter, irregular MFCCs
        
        classification = "Normal"
        if pitch < 180 and pitch > 0:
            classification = "Deep Voice"
        elif spectral_energy < 50:
            classification = "Feeble Voice"
        elif jitter > 0.05 or shimmer > 0.15:
            classification = "Coarse Voice"
        else:
            classification = "Clear/Strong"
            
        # Step 4 - Voice Strength Score (0-100)
        # Heuristic: Combination of energy, stability (low jitter/shimmer), and spectral centroid
        stability = max(0, 100 - (jitter * 500 + shimmer * 200)) # Simple inverse relation
        energy_score = min(100, spectral_energy * 2)
        strength_score = int(0.6 * energy_score + 0.4 * stability)
        strength_score = max(10, min(100, strength_score)) # Clamp
        
        # Step 5 - Recommendations
        recommendations = []
        if classification == "Feeble Voice":
            recommendations = [
                "Diaphragmatic breathing exercises",
                "Humming at various intensities",
                "Reading aloud with projection"
            ]
        elif classification == "Coarse Voice":
            recommendations = [
                "Hydration and vocal rest",
                "Gentle glide exercises (siren sounds)",
                "Avoid shouting or throat clearing"
            ]
        elif classification == "Deep Voice":
             recommendations = [
                "Pitch range expansion exercises",
                "Resonance focus shifts",
                "Articulation drills"
            ]
        else:
            recommendations = [
                "Tongue twisters for clarity",
                "Singing along to favorite songs",
                "Rhythmic speech patterns"
            ]
            
        return {
            "status": "success",
            "metrics": {
                "pitch": round(pitch, 2),
                "jitter": round(jitter, 4),
                "shimmer": round(shimmer, 4),
                "energy": round(spectral_energy, 2),
                "mfcc": [round(m, 2) for m in mfcc_mean]
            },
            "classification": classification,
            "strength_score": strength_score,
            "recommendations": recommendations,
            "timestamp": np.datetime64('now').astype(str)
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}
