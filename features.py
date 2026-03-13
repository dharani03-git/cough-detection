import librosa
import numpy as np
try:
    import tensorflow as tf
    import tensorflow_hub as hub
    TF_AVAILABLE = True
except ImportError:
    tf = None
    hub = None
    TF_AVAILABLE = False
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import io
import base64

# Global model placeholder for lazy loading
yamnet_model = None

def get_yamnet_model():
    global yamnet_model
    if not TF_AVAILABLE:
        return None
    if yamnet_model is None:
        try:
            print("Loading YAMNet model from TensorFlow Hub (first time)...")
            yamnet_model_handle = 'https://tfhub.dev/google/yamnet/1'
            yamnet_model = hub.load(yamnet_model_handle)
            print("YAMNet model loaded.")
        except Exception as e:
            print(f"Error loading YAMNet: {e}")
            yamnet_model = None
    return yamnet_model

def extract_mfcc(audio_signal, sample_rate, n_mfcc=40, n_fft=2048, hop_length=512):
    """
    Extracts MFCC features from an audio signal.
    Returns: MFCC matrix and mean MFCC vector.
    """
    mfccs = librosa.feature.mfcc(y=audio_signal, sr=sample_rate, n_mfcc=n_mfcc, n_fft=n_fft, hop_length=hop_length)
    mfccs_mean = np.mean(mfccs.T, axis=0) # (40,)
    return mfccs, mfccs_mean

def extract_yamnet_embeddings(audio_waveform):
    """
    Extracts YAMNet embeddings (1024-dim) from audio waveform.
    Uses mean pooling across time frames.
    """
    # YAMNet expects a float32 tensor of shape [variable_length]
    model = get_yamnet_model()
    if model is None:
        # Fallback to zero embeddings if TF is not available
        return np.zeros(1024, dtype=np.float32)
    
    scores, embeddings, spectrogram = model(audio_waveform)
    
    # Pool embeddings across time (mean pooling)
    pooled_embeddings = tf.reduce_mean(embeddings, axis=0)
    return pooled_embeddings.numpy()

def visualize_mfcc(mfccs, sample_rate, hop_length=512, title="MFCC"):
    """
    Visualizes the MFCC spectrogram.
    """
    plt.figure(figsize=(10, 4))
    librosa.display.specshow(mfccs, sr=sample_rate, hop_length=hop_length, x_axis='time')
    plt.colorbar()
    plt.title(title)
    plt.tight_layout()
    plt.show()

def get_combined_features(audio_signal, sample_rate):
    """
    Combines MFCC mean and YAMNet embeddings into a single vector.
    """
    _, mfcc_mean = extract_mfcc(audio_signal, sample_rate)
    yamnet_emb = extract_yamnet_embeddings(audio_signal)
    
    # Combined shape: (40 + 1024) = 1064
    combined = np.concatenate([mfcc_mean, yamnet_emb])
    return combined

def generate_spectrogram_base64(audio_signal, sample_rate):
    """
    Generates a PNG spectrogram image (base64 encoded) for the frontend.
    """
    plt.figure(figsize=(10, 4), dpi=100)
    plt.axis('off')
    S = librosa.feature.melspectrogram(y=audio_signal, sr=sample_rate, n_mels=128, fmax=8000)
    S_dB = librosa.power_to_db(S, ref=np.max)
    librosa.display.specshow(S_dB, sr=sample_rate, fmax=8000)
    
    # Save to buffer
    buf = io.BytesIO()
    plt.savefig(buf, format='png', bbox_inches='tight', pad_inches=0, transparent=True)
    buf.seek(0)
    image_base64 = base64.b64encode(buf.read()).decode('utf-8')
    plt.close()
    return image_base64

def get_xai_saliency(audio_signal, sample_rate, target_node="Pneumonia"):
    """
    Returns a mock saliency map (time-frequency energy clusters) that
    represents what the CNN focuses on for specific diagnoses.
    """
    # Create mel spectrogram
    S = librosa.feature.melspectrogram(y=audio_signal, sr=sample_rate, n_mels=128)
    S_db = librosa.power_to_db(S, ref=np.max)
    
    # Simulate a "Neural Attention Activation" heatmap
    # Higher energy in specific frequency bands depending on target_node
    # Pneumonia (Rales/Crackles): High frequency spikes (3k-6k Hz)
    # Asthma (Wheezing): Low-mid frequency continuous bands (200-800 Hz)
    
    attention_mask = np.zeros_like(S_db)
    if target_node == "Pneumonia":
        # Highlight high frequency "crackles"
        attention_mask[80:120, :] = 1.0
    elif target_node == "Asthma":
        # Highlight low-mid wheezing
        attention_mask[10:40, :] = 1.0
    else:
        # General highlights
        attention_mask[20:60, :] = 1.0
        
    # Scale back to visualize
    saliency = (S_db * attention_mask)
    
    # Convert saliency to base64 heatmap
    plt.figure(figsize=(10, 4), dpi=100)
    plt.axis('off')
    librosa.display.specshow(saliency, sr=sample_rate, cmap='inferno')
    
    buf = io.BytesIO()
    plt.savefig(buf, format='png', bbox_inches='tight', pad_inches=0, transparent=True)
    buf.seek(0)
    heatmap_base64 = base64.b64encode(buf.read()).decode('utf-8')
    plt.close()
    
    return heatmap_base64

if __name__ == "__main__":
    # Dummy test with noise
    sr = 16000
    dummy_audio = np.random.uniform(-1, 1, sr * 2).astype(np.float32)
    
    mfcc_mat, mfcc_m = extract_mfcc(dummy_audio, sr)
    print(f"MFCC shape: {mfcc_mat.shape}, Mean shape: {mfcc_m.shape}")
    
    yam_emb = extract_yamnet_embeddings(dummy_audio)
    print(f"YAMNet embedding shape: {yam_emb.shape}")
    
    combined = get_combined_features(dummy_audio, sr)
    print(f"Combined features shape: {combined.shape}")
