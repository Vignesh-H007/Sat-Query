import os
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from services.image_processor import process_image_to_bytes
from services.gemini_service import analyze_satellite_imagery

app = FastAPI(title="SatQuery AI Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/analyze")
async def analyze_endpoint(
    prompt: str = Form(...),
    files: list[UploadFile] = File(default=[])
):
    try:
        processed_images = []
        for file in files:
            raw_bytes = await file.read()
            img_bytes, mime_type = process_image_to_bytes(raw_bytes, file.filename)
            processed_images.append((img_bytes, mime_type))
            
        result = await analyze_satellite_imagery(prompt, processed_images)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health():
    return {"status": "online", "model": "gemini-1.5-pro", "system": "SatQuery AI"}