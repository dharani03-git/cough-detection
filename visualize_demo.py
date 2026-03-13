import librosa
import librosa.display
import matplotlib.pyplot as plt
import numpy as np
from preprocessing import load_and_preprocess_audio
from features import extract_mfcc

def visualize_cough(file_path):
    """
    Loads a cough audio file and plots its Waveform and MFCC Spectrogram.
    """
    print(f"Visualizing: {file_path}")
    
    # 1. Preprocess
    audio, sr = load_and_preprocess_audio(file_path)
    if audio is None:
        print("Error: Could not load audio.")
        return

    # 2. Extract MFCC
    mfccs, _ = extract_mfcc(audio, sr)

    # 3. Plotting
    plt.figure(figsize=(12, 8))

    # Waveform
    plt.subplot(2, 1, 1)
    librosa.display.waveshow(audio, sr=sr)
    plt.title("Cough Waveform (Normalized & Trimmed)")
    plt.xlabel("Time (s)")
    plt.ylabel("Amplitude")

    # MFCC
    plt.subplot(2, 1, 2)
    librosa.display.specshow(mfccs, sr=sr, x_axis='time')
    plt.colorbar(format='%+2.0f dB')
    plt.title("MFCC Spectrogram")
    
    plt.tight_layout()
    plt.show()

if __name__ == "__main__":
    import sys
    import os
    
    # Check if a file was provided, otherwise look for dummy data
    if len(sys.argv) > 1:
        file = sys.argv[1]
    else:
        # Try to find any wav in the dataset
        file = None
        for root, dirs, files in os.walk("dataset"):
            for f in files:
                if f.endswith(".wav"):
                    file = os.path.join(root, f)
                    break
            if file: break
    
    if file and os.path.exists(file):
        visualize_cough(file)
    else:
        print("Please provide a .wav file or run generate_dummy_data.py first.")
