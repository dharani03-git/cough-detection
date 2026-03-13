import os
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, precision_score, recall_score, f1_score, roc_curve, auc
from sklearn.preprocessing import LabelEncoder

# Optional visual dependencies
try:
    import seaborn as sns
except ImportError:
    sns = None

# Optional ML dependencies
TF_AVAILABLE = False
try:
    import tensorflow as tf
    from tensorflow.keras import layers, models
    TF_AVAILABLE = True
except ImportError:
    print("WARNING: TensorFlow not found or unsupported on this Python version. CNN training will be skipped.")
    tf = None
    models = None

from preprocessing import load_and_preprocess_audio
from features import get_combined_features, extract_mfcc

# Configuration
DATASET_PATH = "dataset"
MODELS_PATH = "models"
CLASSES = ["healthy", "asthma", "pneumonia"]
IMG_HEIGHT = 40
IMG_WIDTH = 128 # Target width for MFCC spectrogram

def pad_or_truncate(mfcc, target_width=128):
    """
    Standardize the width of MFCC spectrograms for CNN input.
    """
    if mfcc.shape[1] > target_width:
        return mfcc[:, :target_width]
    else:
        padding = target_width - mfcc.shape[1]
        return np.pad(mfcc, ((0, 0), (0, padding)), mode='constant')

def prepare_dataset():
    """
    Reads audio files from dataset/ folder and extracts features.
    Returns: fused features (X_fused), spectrograms (X_spec), and labels (y).
    """
    X_fused = []
    X_spec = []
    y = []
    
    print("Starting dataset preparation...")
    
    if not os.path.exists(DATASET_PATH):
        print(f"Dataset path {DATASET_PATH} not found!")
        return None, None, None

    for label in CLASSES:
        class_dir = os.path.join(DATASET_PATH, label)
        if not os.path.exists(class_dir):
            continue
            
        files = [f for f in os.listdir(class_dir) if f.endswith('.wav')]
        print(f"Processing {len(files)} files for class: {label}")
        
        for file in files:
            file_path = os.path.join(class_dir, file)
            audio, sr = load_and_preprocess_audio(file_path)
            
            if audio is not None:
                # 1. Combined features for Random Forest
                combined = get_combined_features(audio, sr)
                X_fused.append(combined)
                
                # 2. MFCC Spectrogram for CNN
                mfcc, _ = extract_mfcc(audio, sr)
                mfcc_padded = pad_or_truncate(mfcc, IMG_WIDTH)
                X_spec.append(mfcc_padded)
                
                y.append(label)

    return np.array(X_fused), np.array(X_spec), np.array(y)

def build_cnn(input_shape, num_classes):
    """
    Simple CNN architecture for MFCC spectrogram classification.
    """
    model = models.Sequential([
        layers.Conv2D(32, (3, 3), activation='relu', input_shape=input_shape),
        layers.MaxPooling2D((2, 2)),
        layers.Conv2D(64, (3, 3), activation='relu'),
        layers.MaxPooling2D((2, 2)),
        layers.Conv2D(64, (3, 3), activation='relu'),
        layers.Flatten(),
        layers.Dense(64, activation='relu'),
        layers.Dropout(0.3),
        layers.Dense(num_classes, activation='softmax')
    ])
    model.compile(optimizer='adam', loss='sparse_categorical_crossentropy', metrics=['accuracy'])
    return model

def plot_history(history):
    plt.figure(figsize=(12, 4))
    plt.subplot(1, 2, 1)
    plt.plot(history.history['accuracy'], label='Train Accuracy')
    plt.plot(history.history['val_accuracy'], label='Val Accuracy')
    plt.title('Training Accuracy')
    plt.legend()
    
    plt.subplot(1, 2, 2)
    plt.plot(history.history['loss'], label='Train Loss')
    plt.plot(history.history['val_loss'], label='Val Loss')
    plt.title('Training Loss')
    plt.legend()
    plt.show()

def evaluate_model(y_test, y_pred, y_prob, labels, model_name="Model"):
    print(f"\n--- {model_name} Evaluation ---")
    print(f"Accuracy: {accuracy_score(y_test, y_pred):.4f}")
    print(classification_report(y_test, y_pred, target_names=labels))
    
    # Confusion Matrix
    cm = confusion_matrix(y_test, y_pred)
    plt.figure(figsize=(8, 6))
    sns.heatmap(cm, annot=True, fmt='d', xticklabels=labels, yticklabels=labels, cmap='Blues')
    plt.title(f"{model_name} Confusion Matrix")
    plt.xlabel('Predicted')
    plt.ylabel('True')
    plt.show()

def train():
    # 1. Prepare Data
    X_f, X_s, y = prepare_dataset()
    if X_f is None or len(X_f) == 0:
        print("Dataset is empty. Please add .wav files to dataset/ folder.")
        return

    # Encode labels
    le = LabelEncoder()
    y_encoded = le.fit_transform(y)
    
    # 2. Split for RandomForest
    X_train_f, X_test_f, y_train, y_test = train_test_split(X_f, y_encoded, test_size=0.3, random_state=42)
    X_val_f, X_test_f, y_val, y_test = train_test_split(X_test_f, y_test, test_size=0.5, random_state=42)
    
    # RandomForest Training
    print("\nTraining RandomForest...")
    rf = RandomForestClassifier(n_estimators=200, max_depth=20, random_state=42)
    rf.fit(X_train_f, y_train)
    joblib.dump(rf, os.path.join(MODELS_PATH, "rf_model.pkl"))
    joblib.dump(le, os.path.join(MODELS_PATH, "label_encoder.pkl"))
    
    rf_preds = rf.predict(X_test_f)
    evaluate_model(y_test, rf_preds, rf.predict_proba(X_test_f), CLASSES, "Random Forest")

    # 3. Split for CNN
    if TF_AVAILABLE:
        X_train_s, X_test_s, y_train, y_test = train_test_split(X_s, y_encoded, test_size=0.3, random_state=42)
        X_val_s, X_test_s, y_val, y_test = train_test_split(X_test_s, y_test, test_size=0.5, random_state=42)
        
        # Reshape for CNN (Samples, Height, Width, Channels)
        X_train_s = X_train_s[..., np.newaxis]
        X_val_s = X_val_s[..., np.newaxis]
        X_test_s = X_test_s[..., np.newaxis]
        
        print("\nTraining CNN...")
        cnn = build_cnn((IMG_HEIGHT, IMG_WIDTH, 1), len(CLASSES))
        history = cnn.fit(X_train_s, y_train, epochs=20, validation_data=(X_val_s, y_val), verbose=1)
        cnn.save(os.path.join(MODELS_PATH, "cnn_model.h5"))
        plot_history(history)
        
        cnn_probs = cnn.predict(X_test_s)
        cnn_preds = np.argmax(cnn_probs, axis=1)
        evaluate_model(y_test, cnn_preds, cnn_probs, CLASSES, "CNN")
    else:
        print("\nSkipping CNN training (TensorFlow unavailable).")

if __name__ == "__main__":
    train()
