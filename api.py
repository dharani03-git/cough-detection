from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os
import uuid
import json
import sqlite3
import hashlib
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime
from predict import predict_cough
from voicedev_features import analyze_voice_dev

app = FastAPI(title="Cough AI - Respiratory Risk API")

# Database Setup
DB_PATH = "history.db"

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS history 
                 (id TEXT PRIMARY KEY, timestamp TEXT, filename TEXT, 
                  prediction TEXT, confidence REAL, biomarkers TEXT,
                  file_hash TEXT)''')
    conn.commit()
    conn.close()

init_db()

# Add CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routes
@app.get("/api/health", tags=["Health"])
def health():
    return {"status": "online", "engine": "CoughAI-V2", "version": "1.0"}

def get_pg_connection():
    db_url = os.getenv("DATABASE_URL", "postgresql://postgres:root@localhost:5432/coughdetection")
    return psycopg2.connect(db_url)

@app.post("/api/patients", tags=["Patients"])
async def register_patient(request: Request):
    data = await request.json()
    conn = get_pg_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO patients 
                (full_name, age, gender, phone_number, email, address, smoking_history, 
                 existing_conditions, symptoms, symptom_duration, fever, breathing_difficulty, screening_status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING patient_id;
            """, (
                data.get("fullName"),
                int(data.get("age")) if data.get("age") else None,
                data.get("gender"),
                data.get("phoneNumber"),
                data.get("email"),
                data.get("address"),
                data.get("smokingHistory"),
                data.get("existingConditions"),
                ",".join(data.get("symptoms", [])),
                data.get("symptomDuration"),
                data.get("fever"),
                data.get("breathingDifficulty"),
                "Pending"
            ))
            patient_id = cur.fetchone()[0]
            # generate patient_id like RH-1234
            rh_id = f"RH-{1000 + patient_id}"
            conn.commit()
            return {"status": "success", "patient_id": rh_id, "db_id": patient_id}
    except Exception as e:
        conn.rollback()
        print("DB Error:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.get("/api/patients", tags=["Patients"])
def get_patients():
    conn = get_pg_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT patient_id, full_name, age, gender, phone_number, 
                       address, screening_status, followup_status, risk_level,
                       smoking_history, existing_conditions
                FROM patients
                ORDER BY patient_id DESC
            """)
            patients = cur.fetchall()
            return patients
    except Exception as e:
        print("DB Error:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.get("/history", tags=["Data"])
def get_history():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT * FROM history ORDER BY timestamp DESC LIMIT 50")
    rows = c.fetchall()
    conn.close()
    
    return [
        {
            "id": r[0],
            "timestamp": r[1],
            "filename": r[2],
            "prediction": r[3],
            "confidence": r[4],
            "biomarkers": json.loads(r[5]) if r[5] else None,
            "file_hash": r[6] if len(r) > 6 else "Legacy"
        } for r in rows
    ]

@app.post("/predict")
async def predict(file: UploadFile = File(...), metadata: str = None):
    UPLOAD_DIR = "temp_uploads"
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    
    allowed_extensions = ['.wav', '.mp3']
    if not any(file.filename.lower().endswith(ext) for ext in allowed_extensions):
        raise HTTPException(status_code=400, detail="Only .wav and .mp3 files are supported.")

    file_id = str(uuid.uuid4())
    extension = os.path.splitext(file.filename)[1].lower()
    temp_path = os.path.join(UPLOAD_DIR, f"{file_id}{extension}")
    
    try:
        # Parse metadata if provided
        symptom_data = None
        if metadata:
            try:
                symptom_data = json.loads(metadata)
            except:
                pass

        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        result = predict_cough(temp_path, model_type="rf", metadata=symptom_data)
        
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
            
        sha256_hash = hashlib.sha256()
        with open(temp_path,"rb") as f:
            for byte_block in iter(lambda: f.read(4096),b""):
                sha256_hash.update(byte_block)
        file_hash = sha256_hash.hexdigest()

        try:
            conn = sqlite3.connect(DB_PATH)
            c = conn.cursor()
            c.execute("INSERT INTO history VALUES (?, ?, ?, ?, ?, ?, ?)",
                      (file_id, datetime.now().strftime("%Y-%m-%d %H:%M:%S"), 
                       file.filename, result["prediction"], result["confidence"], 
                       json.dumps(result["biomarkers"]), file_hash))
            conn.commit()
            conn.close()
        except Exception as db_err:
            print(f"DB Error: {db_err}")

        result["audit_hash"] = file_hash
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

@app.post("/api/voice-dev/analyze")
async def voice_dev_analyze(file: UploadFile = File(...)):
    print(f"\n[VOICE-DEV] Received analysis request for: {file.filename}")
    UPLOAD_DIR = "temp_uploads"
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    
    file_id = str(uuid.uuid4())
    extension = os.path.splitext(file.filename)[1].lower()
    temp_path = os.path.join(UPLOAD_DIR, f"vdev_{file_id}{extension}")
    
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        print(f"[VOICE-DEV] Processing audio...")
        result = analyze_voice_dev(temp_path)
        
        if result.get("status") == "error":
            print(f"[VOICE-DEV] Feature extraction error: {result.get('message')}")
            raise HTTPException(status_code=500, detail=result.get("message"))
            
        print(f"[VOICE-DEV] Analysis complete. Score: {result.get('strength_score')}")
        return result
        
    except Exception as e:
        print(f"[VOICE-DEV] Critical Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

# Unified Frontend Integration
FRONTEND_DIST = os.path.join(os.path.dirname(__file__), "frontend", "dist")

if os.path.exists(FRONTEND_DIST):
    # Mount assets
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST, "assets")), name="assets")

    # Serve index.html for all other routes (SPA)
    @app.get("/{full_path:path}")
    async def serve_spa(request: Request, full_path: str):
        # If it's an API call, it should have been caught by routes above
        if full_path.startswith("api/") or full_path in ["predict", "history"]:
            raise HTTPException(status_code=404)
        
        index_file = os.path.join(FRONTEND_DIST, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return {"error": "Frontend build files missing. Run 'npm run build' in frontend folder."}
else:
    @app.get("/")
    def root():
        return {"message": "API Online. Frontend missing. Please build the frontend."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8888)
