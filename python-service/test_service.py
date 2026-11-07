"""
Unit tests for Python Intelligence & Forensic Utilities
"""

from fastapi.testclient import TestClient
from main import app
import io
from PIL import Image

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "OPERATIONAL"
    assert data["bns_sections_indexed"] > 0

def test_bns_lookup_all():
    response = client.get("/api/v1/legal/bns-lookup")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 5

def test_bns_lookup_search():
    response = client.get("/api/v1/legal/bns-lookup?q=theft")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    assert any("303" in item["section"] or "305" in item["section"] for item in data["results"])

def test_haversine_distance():
    # Delhi Connaught Place to India Gate (~2.5 km)
    payload = {
        "lat1": 28.6315,
        "lon1": 77.2167,
        "lat2": 28.6129,
        "lon2": 77.2295
    }
    response = client.post("/api/v1/spatial/haversine-distance", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert 2.0 <= data["distance_km"] <= 3.0

def test_exif_stripping():
    # Create sample image in memory
    img = Image.new("RGB", (100, 100), color="blue")
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)

    files = {"file": ("test_tip.jpg", buf.getvalue(), "image/jpeg")}
    response = client.post("/api/v1/metadata/scrub-exif", files=files)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "SUCCESS"
    assert data["exif_stripped"] is True

if __name__ == "__main__":
    test_health_check()
    test_bns_lookup_all()
    test_bns_lookup_search()
    test_haversine_distance()
    test_exif_stripping()
    print("All Python service tests passed successfully!")
