"""
SatQuery AI — API Microservice Test Suite
Tests all FastAPI endpoints using FastAPI TestClient against real BigEarthNet-S1 rasters.
"""

import sys
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from fastapi.testclient import TestClient
from api.server import app, startup_event

# Initialize client and trigger startup lifecycle
startup_event()
client = TestClient(app)


def test_api_health():
    print("\n[1/8] Testing GET /api/health...")
    response = client.get("/api/health")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    assert data["status"] in ["healthy", "degraded"], f"Unexpected status {data['status']}"
    assert "device" in data
    assert data["model_a_loaded"] is True
    assert data["encoder_loaded"] is True
    print(f"      Status: {data['status']} | Device: {data['device']} ({data.get('device_name')}) — PASS")


def test_api_classes():
    print("\n[2/8] Testing GET /api/classes...")
    response = client.get("/api/classes")
    assert response.status_code == 200
    data = response.json()
    assert data["total_classes"] == 19
    assert len(data["classes"]) == 19
    print(f"      Total Classes: {data['total_classes']} — PASS")


def test_api_sample_patches_and_preview():
    print("\n[3/8] Testing GET /api/patches/sample & GET /api/patches/{patch_id}/preview...")
    response = client.get("/api/patches/sample?limit=5")
    assert response.status_code == 200
    data = response.json()
    assert data["total_available"] > 0
    assert len(data["samples"]) > 0
    sample_patch = data["samples"][0]
    patch_id = sample_patch["patch_id"]
    print(f"      Retrieved {len(data['samples'])} samples. First: {patch_id}")

    # Test thumbnail preview
    prev_response = client.get(f"/api/patches/{patch_id}/preview")
    assert prev_response.status_code == 200
    assert prev_response.headers["content-type"] == "image/png"
    assert len(prev_response.content) > 1000  # valid PNG binary
    print(f"      Generated False-Color SAR Preview PNG ({len(prev_response.content)} bytes) — PASS")
    return sample_patch


def test_api_query_with_patch_id(sample_patch):
    print("\n[4/8] Testing POST /api/query (Land Cover Query on Sample Patch)...")
    patch_id = sample_patch["patch_id"]
    response = client.post(
        "/api/query",
        data={
            "query": "Identify the primary land cover categories and vegetation in this Sentinel-1 SAR raster.",
            "patch_id": patch_id
        }
    )
    assert response.status_code == 200, f"Error: {response.text}"
    data = response.json()
    assert "answer" in data
    assert "uncertainty_level" in data
    assert "audit_receipt_id" in data
    assert data["audit_receipt_id"].startswith("SQ-")
    print(f"      Selected Model:   {data['selected_model']}")
    print(f"      Uncertainty:      {data['uncertainty_level']} (Confidence: {data['confidence']})")
    print(f"      Audit Receipt ID: {data['audit_receipt_id']}")
    print(f"      Answer:           {data['answer'][:80]}...")
    print("      POST /api/query (Patch ID) — PASS")
    return data["audit_receipt_id"]


def test_api_query_with_file_upload(sample_patch):
    print("\n[5/8] Testing POST /api/query (Multipart File Upload of GeoTIFFs)...")
    vh_path = Path(sample_patch["vh_path"])
    vv_path = Path(sample_patch["vv_path"])

    with open(vh_path, "rb") as f_vh, open(vv_path, "rb") as f_vv:
        response = client.post(
            "/api/query",
            data={"query": "What type of land surface or terrain is visible here?"},
            files={
                "vh_file": ("test_vh.tif", f_vh, "image/tiff"),
                "vv_file": ("test_vv.tif", f_vv, "image/tiff")
            }
        )

    assert response.status_code == 200, f"Error: {response.text}"
    data = response.json()
    assert "answer" in data
    assert data["confidence"] > 0.0
    print(f"      Uploaded GeoTIFFs processed successfully. Receipt: {data['audit_receipt_id']} — PASS")


def test_api_change_detection(sample_patches):
    print("\n[6/8] Testing POST /api/change-detection (Bi-Temporal Comparison)...")
    p1 = sample_patches[0]["patch_id"]
    p2 = sample_patches[1]["patch_id"] if len(sample_patches) > 1 else p1

    response = client.post(
        "/api/change-detection",
        data={
            "t1_patch_id": p1,
            "t2_patch_id": p2
        }
    )
    assert response.status_code == 200, f"Error: {response.text}"
    data = response.json()
    assert "semantic_similarity" in data
    assert "changed_surface_percentage" in data
    assert "change_severity" in data
    print(f"      Semantic Similarity: {data['semantic_similarity']}")
    print(f"      Changed Surface:     {data['changed_surface_percentage']}%")
    print(f"      Severity:            {data['change_severity']}")
    print(f"      Explanation:         {data['explanation']}")
    print("      POST /api/change-detection — PASS")


def test_api_encode_sar_patch(sample_patch):
    print("\n[7/8] Testing POST /api/encode (SAR 512-dim Feature Extractor)...")
    response = client.post(
        "/api/encode",
        data={"patch_id": sample_patch["patch_id"]}
    )
    assert response.status_code == 200, f"Error: {response.text}"
    data = response.json()
    assert data["embedding_dim"] == 512
    assert len(data["embedding"]) == 512
    assert 0.99 <= data["l2_norm"] <= 1.01
    print(f"      Vector Dim: {data['embedding_dim']} | L2-Norm: {data['l2_norm']} | Time: {data['processing_time_ms']}ms — PASS")


def test_api_receipts(receipt_id):
    print("\n[8/8] Testing GET /api/receipts & GET /api/receipts/{receipt_id}...")
    # List receipts
    list_res = client.get("/api/receipts?limit=10")
    assert list_res.status_code == 200
    list_data = list_res.json()
    assert list_data["total_receipts"] > 0
    print(f"      Listed {len(list_data['receipts'])} recent audit receipts (Total: {list_data['total_receipts']})")

    # Get single receipt
    single_res = client.get(f"/api/receipts/{receipt_id}")
    assert single_res.status_code == 200
    r_data = single_res.json()
    assert r_data["receipt_id"] == receipt_id
    assert "geo_validity_gate" in r_data
    assert "evidence_and_uncertainty" in r_data
    assert "specialist_routing" in r_data
    print(f"      Fetched Audit Receipt: {receipt_id} with full verification trace — PASS")


def test_api_pdf_export(receipt_id):
    print("\n[9/10] Testing GET /api/receipts/{receipt_id}/pdf (Official PDF Audit Report)...")
    res = client.get(f"/api/receipts/{receipt_id}/pdf")
    assert res.status_code == 200
    assert res.headers["content-type"] == "application/pdf"
    assert len(res.content) > 1500  # Valid PDF binary
    print(f"      Generated Publication-Quality PDF ({len(res.content)} bytes) — PASS")


def test_api_saliency(sample_patch):
    print("\n[10/10] Testing GET /api/patches/{patch_id}/saliency (Visual Grounding Heatmap)...")
    pid = sample_patch["patch_id"]
    res = client.get(f"/api/patches/{pid}/saliency?feature=water")
    assert res.status_code == 200
    assert res.headers["content-type"] == "image/png"
    assert len(res.content) > 1000
    print(f"      Generated Saliency Heatmap Overlay ({len(res.content)} bytes) — PASS")


if __name__ == "__main__":
    print("=" * 70)
    print("SATQUERY AI — REST API MICROSERVICE TEST SUITE")
    print("=" * 70)

    test_api_health()
    test_api_classes()
    sample = test_api_sample_patches_and_preview()
    
    # Get 2 samples for change detection
    samples_resp = client.get("/api/patches/sample?limit=2").json()
    samples = samples_resp["samples"]

    receipt_id = test_api_query_with_patch_id(sample)
    test_api_query_with_file_upload(sample)
    test_api_change_detection(samples)
    test_api_encode_sar_patch(sample)
    test_api_receipts(receipt_id)
    test_api_pdf_export(receipt_id)
    test_api_saliency(sample)

    print("\n" + "=" * 70)
    print("ALL API MICROSERVICE TESTS PASSED SUCCESSFULLY! 100% OPERATIONAL")
    print("=" * 70)

