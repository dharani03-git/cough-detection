import subprocess
import os
import sys
import time
import signal

def run_app():
    """
    Launches both the FastAPI backend and Vite frontend concurrently.
    """
    print("========================================")
    print("🚀 Cough AI - Respiratory Risk Pipeline")
    print("========================================")

    # 1. Validation Check: Ensure models exist
    if not os.path.exists("models/rf_model.pkl"):
        print("⚠️  Warning: Models not found in /models directory.")
        print("Running setup_project.py first to train initial models...")
        subprocess.run([sys.executable, "setup_project.py"], check=True)

    # 2. Start Backend (FastAPI)
    # Using 'start' on Windows to open in a new window for better log visibility
    print("\n[BACKEND] Starting server at http://localhost:8000...")
    if sys.platform == "win32":
        # Syntax: start "Title" cmd /c "command"
        backend_proc = subprocess.Popen('start "Cough-AI-Backend" cmd /c "uvicorn api:app --reload --host 0.0.0.0 --port 8000"', shell=True)
    else:
        # For Mac/Linux (though user is on Windows)
        backend_proc = subprocess.Popen(["uvicorn", "api:app", "--reload", "--host", "0.0.0.0", "--port", "8000"])

    # Wait for backend to initialize
    time.sleep(3)

    # 3. Start Frontend (Vite)
    print("[FRONTEND] Starting client at http://localhost:3000...")
    try:
        frontend_proc = subprocess.Popen(["npm", "run", "dev"], cwd="frontend", shell=True)
        frontend_proc.wait()
    except KeyboardInterrupt:
        print("\n🛑 Shutting down services...")
        if sys.platform != "win32":
            backend_proc.terminate()
        else:
            # On windows, the 'start' command opened a new window; 
            # the user will need to close the backend window manually or 
            # we can try to kill by port (more complex).
            print("Note: Please close the Backend CMD window to fully terminate the server.")
        sys.exit(0)

if __name__ == "__main__":
    run_app()
