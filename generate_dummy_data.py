import numpy as np
import os
import soundfile as sf

def generate_dummy_data():
    """
    Generates synthetic cough (.wav) files for testing the pipeline.
    """
    DATASET_PATH = "dataset"
    CLASSES = ["healthy", "asthma", "pneumonia"]
    SR = 16000
    DURATION = 2 # seconds
    
    print("Generating dummy dataset for testing...")
    
    for label in CLASSES:
        class_dir = os.path.join(DATASET_PATH, label)
        os.makedirs(class_dir, exist_ok=True)
        
        for i in range(10): # 10 samples per class
            filename = f"dummy_{label}_{i}.wav"
            filepath = os.path.join(class_dir, filename)
            
            # Generate random noise with some "bursts" to mimic coughs
            noise = np.random.normal(0, 0.1, SR * DURATION)
            # Add a Gaussian burst
            t = np.linspace(0, DURATION, SR * DURATION)
            burst = np.exp(-100 * (t - 0.5)**2) # A "pop" at 0.5s
            signal = noise + burst
            
            # Normalize
            signal = signal / np.max(np.abs(signal))
            
            sf.write(filepath, signal, SR)
            
    print("Dummy dataset generated successfully.")

if __name__ == "__main__":
    generate_dummy_data()
