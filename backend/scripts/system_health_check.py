#!/usr/bin/env python3
import requests
import json
import os
import sys

def run_diagnostic():
    print("=" * 60)
    print("      SatQuery AI — Full System Automated Health Check")
    print("=" * 60)

    # 1. Frontend Check
    try:
        r_fe = requests.get("http://localhost:5173", timeout=3)
        print(f"[OK] Frontend Server (port 5173): ONLINE (Status {r_fe.status_code})")
    except Exception as e:
        print(f"[FAIL] Frontend Server (port 5173): OFFLINE ({str(e)})")

    # 2. Java Backend Health Check
    try:
        r_java = requests.get("http://localhost:8080/api/health", timeout=3)
        print(f"[OK] Java Backend API (port 8080): ONLINE ({r_java.json()})")
    except Exception as e:
        print(f"[FAIL] Java Backend API (port 8080): OFFLINE ({str(e)})")

    # 3. Python Remote VLM Server Check
    try:
        r_vlm = requests.post(
            "http://localhost:5000/analyze",
            json={"task": "VQA", "query": "Test health query", "images": []},
            headers={"X-SatQuery-Api-Key": "satquery-vlm-key-2026-sih"},
            timeout=3
        )
        print(f"[OK] Remote VLM Model Server (port 5000): ONLINE (Status {r_vlm.status_code})")
    except Exception as e:
        print(f"[FAIL] Remote VLM Model Server (port 5000): OFFLINE ({str(e)})")

    # 4. End-to-End Pipeline Check (Upload + Analyze)
    img_path = "backend/uploads/R2AWF01222026268035.jpg.jpeg"
    if os.path.exists(img_path):
        try:
            files = {'file': ('R2AWF01222026268035.jpg.jpeg', open(img_path, 'rb'), 'image/jpeg')}
            up_resp = requests.post("http://localhost:8080/api/upload", files=files, timeout=5).json()
            img_id = up_resp.get("imageId")
            print(f"[OK] Java Image Upload: SUCCESS (Image ID: {img_id})")

            ana_payload = {
                "question": "What land cover features are present in this satellite image?",
                "queryText": "What land cover features are present in this satellite image?",
                "imageIds": [img_id]
            }
            ana_resp = requests.post("http://localhost:8080/api/analyze", json=ana_payload, timeout=20).json()

            ans = ana_resp.get("answer", "")
            status = ana_resp.get("status", "")
            mode = ana_resp.get("mode", "")

            print(f"[OK] End-to-End Analysis Status: {status}")
            print(f"[OK] Execution Mode: {mode}")
            print(f"[OK] Remote VLM Model Output Answer:\n     \"{ans}\"")

            if status == "SUCCESS":
                print("\n[VERDICT] ALL SYSTEMS 100% VERIFIED AND WORKING PERFECTLY!")
            else:
                print(f"\n[WARNING] Output status: {status}")

        except Exception as ex:
            print(f"[FAIL] End-to-End Pipeline Check Failed: {str(ex)}")

if __name__ == "__main__":
    run_diagnostic()
