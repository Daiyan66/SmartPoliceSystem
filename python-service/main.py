"""
Smart Police System - Python Intelligence & Forensic Utilities Service
Legal Alignment: BNS (2023), BNSS (2023), BSA (2023)
"""

import io
import math
from typing import List, Optional
from fastapi import FastAPI, File, UploadFile, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image

app = FastAPI(
    title="Smart Police System - Python Forensic & Intelligence Engine",
    version="1.0.0",
    description="Microservice for BNS legal reference mapping, EXIF metadata scrubbing, and spatial clustering."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Reference dictionary for Bharatiya Nyaya Sanhita (BNS, 2023)
BNS_DICTIONARY = [
    {
        "section": "BNS 303(2)",
        "title": "Theft",
        "description": "Theft of movable property without consent. Replaces IPC Section 379.",
        "cognizable": True,
        "bailable": False,
        "severity": 3,
        "category": "Property Crime"
    },
    {
        "section": "BNS 305",
        "title": "Theft in dwelling house, vehicle, or vessel",
        "description": "Aggravated theft inside premises or vehicles. Replaces IPC Section 380.",
        "cognizable": True,
        "bailable": False,
        "severity": 4,
        "category": "Property Crime"
    },
    {
        "section": "BNS 316",
        "title": "Criminal Breach of Trust",
        "description": "Misappropriation of entrusted property. Replaces IPC Section 405/406.",
        "cognizable": True,
        "bailable": False,
        "severity": 3,
        "category": "Financial Crime"
    },
    {
        "section": "BNS 318(4)",
        "title": "Cheating and dishonestly inducing delivery of property",
        "description": "Fraudulent deception or cyber fraud. Replaces IPC Section 420.",
        "cognizable": True,
        "bailable": False,
        "severity": 4,
        "category": "Cyber / Financial Fraud"
    },
    {
        "section": "BNS 74",
        "title": "Assault or use of criminal force to woman with intent to outrage her modesty",
        "description": "Crimes against women. Replaces IPC Section 354.",
        "cognizable": True,
        "bailable": False,
        "severity": 5,
        "category": "Crimes Against Women"
    },
    {
        "section": "BNS 115",
        "title": "Voluntarily causing hurt",
        "description": "Physical injury or bodily harm. Replaces IPC Section 323.",
        "cognizable": False,
        "bailable": True,
        "severity": 2,
        "category": "Violent Crime"
    },
    {
        "section": "BNS 103",
        "title": "Murder",
        "description": "Culpable homicide amounting to murder. Replaces IPC Section 302.",
        "cognizable": True,
        "bailable": False,
        "severity": 5,
        "category": "Homicide"
    }
]

class SpatialPoint(BaseModel):
    id: str
    latitude: float
    longitude: float

class DistanceRequest(BaseModel):
    lat1: float
    lon1: float
    lat2: float
    lon2: float

@app.get("/health")
def health_check():
    return {
        "status": "OPERATIONAL",
        "service": "Smart Police Python AI & Forensic Service",
        "version": "1.0.0",
        "bns_sections_indexed": len(BNS_DICTIONARY),
        "exif_stripper": "ACTIVE",
        "spatial_calculator": "ACTIVE"
    }

@app.get("/api/v1/legal/bns-lookup")
def search_bns(q: Optional[str] = Query(None, description="Search keyword or section name")):
    if not q:
        return {"total": len(BNS_DICTIONARY), "results": BNS_DICTIONARY}
    query = q.lower()
    matches = [
        item for item in BNS_DICTIONARY
        if query in item["section"].lower() or query in item["title"].lower() or query in item["description"].lower()
    ]
    return {"query": q, "total": len(matches), "results": matches}

@app.post("/api/v1/metadata/scrub-exif")
async def scrub_exif(file: UploadFile = File(...)):
    """
    Whistleblower Privacy Engine: Strips EXIF GPS metadata, camera serial numbers,
    and device identifiers before digital evidence storage (BSA 2023 Sec 63 compliant).
    """
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))

        # Re-save image without EXIF metadata
        output = io.BytesIO()
        data = list(image.getdata())
        image_clean = Image.new(image.mode, image.size)
        image_clean.putdata(data)
        
        format_name = image.format or "JPEG"
        image_clean.save(output, format=format_name)
        cleaned_bytes = output.getvalue()

        return {
            "status": "SUCCESS",
            "file_name": file.filename,
            "original_size": len(contents),
            "cleaned_size": len(cleaned_bytes),
            "exif_stripped": True,
            "message": "EXIF metadata and GPS coordinates stripped successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Image processing failed: {str(e)}")

@app.post("/api/v1/spatial/haversine-distance")
def calculate_haversine(req: DistanceRequest):
    """
    Calculate spherical distance between two GPS coordinates using Haversine formula (in meters).
    """
    R = 6371000.0  # Earth radius in meters
    phi1 = math.radians(req.lat1)
    phi2 = math.radians(req.lat2)
    delta_phi = math.radians(req.lat2 - req.lat1)
    delta_lambda = math.radians(req.lon2 - req.lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    distance_meters = R * c

    return {
        "distance_meters": round(distance_meters, 2),
        "distance_km": round(distance_meters / 1000.0, 3)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
