import subprocess
import os
import sys

def run_command(command, cwd=None):
    print(f"Running: {command}")
    process = subprocess.Popen(command, shell=True, cwd=cwd)
    process.wait()
    if process.returncode != 0:
        print(f"Command failed with return code {process.returncode}")
        # Not exiting so we can continue with other steps if possible

def main():
    print("=== Cough AI Project Setup ===")
    
    # 1. Install Backend Requirements
    print("\n[1/4] Installing backend dependencies...")
    run_command(f"{sys.executable} -m pip install -r requirements.txt")

    # 2. Generate Dummy Data (for initial testing)
    print("\n[2/4] Generating dummy dataset...")
    if not os.path.exists("dataset"):
        run_command(f"{sys.executable} generate_dummy_data.py")
    else:
        print("Dataset directory already exists. Skipping generation.")

    # 3. Train models
    print("\n[3/4] Training initial models...")
    if not os.path.exists("models/rf_model.pkl"):
        run_command(f"{sys.executable} train_model.py")
    else:
        print("Models already trained. Skipping.")

    # 4. Setup Frontend
    print("\n[4/4] Setting up frontend...")
    if os.path.exists("frontend"):
        print("Installing frontend dependencies (this may take a minute)...")
        run_command("npm install", cwd="frontend")
    
    print("\n=== Setup Complete! ===")
    print("\nTo run the project:")
    print("1. Start Backend: uvicorn api:app --reload")
    print("2. Start Frontend: cd frontend && npm run dev")
    print("\nNavigate to http://localhost:3000 to use the application.")

if __name__ == "__main__":
    main()
