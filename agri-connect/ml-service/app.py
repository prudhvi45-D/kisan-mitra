

from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional
import hashlib
from fastapi import UploadFile, File
from fastapi.responses import JSONResponse

app = FastAPI(title="Agri-Connect ML Service", version="0.1.0")


class AnalyzeRequest(BaseModel):
    cropType: str
    images: List[str]


class AnalyzeResponse(BaseModel):
    qualityScore: float
    suggestedPrice: Optional[float]


def stable_score(key: str) -> float:
    h = hashlib.sha256(key.encode("utf-8")).hexdigest()
    # Map hash to [0.6, 0.95] for a reasonable quality band
    val = (int(h[:8], 16) % 1000) / 1000.0
    return 0.6 + 0.35 * val


@app.get("/")
def root():
    return {"status": "ml-ok"}


@app.post("/analyze", response_model=AnalyzeResponse)
def analyze(payload: AnalyzeRequest):
    base = stable_score(payload.cropType.lower())
    # very naive adjustment: more images → more confidence → slightly higher
    adj = min(len(payload.images), 5) * 0.015
    quality = min(base + adj, 0.98)

    # Suggest price as a function of quality if market snapshot is not provided by server.
    # The server may override this using today's market price if present.
    # Example: base price band (for demo) 20–80 currency units per kg
    suggested = round(20 + (80 - 20) * quality, 2)
    return {"qualityScore": round(quality, 3), "suggestedPrice": suggested}


# Lightweight fallback endpoint compatible with server expectations
# Accepts an uploaded image and returns fields similar to the heavy /infer
@app.post("/infer")
async def infer(file: UploadFile = File(...)):
    # We don't perform real inference here. Provide deterministic, harmless values.
    name = file.filename or "image"
    base = stable_score(name)
    # Map base to a rough class
    if base > 0.85:
        label = "Good/Fresh"
    elif base > 0.7:
        label = "Rotten/Spoiled"  # mid bucket
    else:
        label = "Completely Bad/Decomposed"

    scores = {
        "Good/Fresh": round(1.0 if label == "Good/Fresh" else 0.1, 3),
        "Rotten/Spoiled": round(1.0 if label == "Rotten/Spoiled" else 0.1, 3),
        "Completely Bad/Decomposed": round(1.0 if label == "Completely Bad/Decomposed" else 0.1, 3),
    }

    resp = {
        "decayed_area_ratio": round(1 - base, 3),
        "vit_class": {"label": label, "scores": scores},
        "final_quality": label,
        "mask_png_base64": "",  # no segmentation in lightweight stub
    }
    return JSONResponse(resp)


# To run locally:
#   uvicorn app:app --host 127.0.0.1 --port 8000 --reload
