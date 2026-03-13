import librosa
import numpy as np
import os

def load_and_preprocess_audio(file_path, target_sr=16000):
    """
    Loads an audio file, resamples, normalizes, and trims silence.
    """
    try:
        # 1. Load the audio file (automatically converts to mono if needed)
        audio, sr = librosa.load(file_path, sr=target_sr, mono=True)
        
        # 2. Normalize amplitude to range [-1, 1]
        if len(audio) > 0:
            audio = librosa.util.normalize(audio)
            
        # 3. Trim silence from both ends
        audio, _ = librosa.effects.trim(audio, top_db=30)
        
        return audio, target_sr
    except Exception as e:
        import traceback
        print(f"Error processing {file_path}:")
        traceback.print_exc()
        return None, str(e)

if __name__ == "__main__":
    # Test block
    test_file = "cough.wav"
    if os.path.exists(test_file):
        signal, rate = load_and_preprocess_audio(test_file)
        print(f"Loaded {test_file} at {rate}Hz, signal length: {len(signal)}")
    else:
        print(f"Test file {test_file} not found. Skip preprocessing test.")
