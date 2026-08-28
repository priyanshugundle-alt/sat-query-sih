# Model Handoff Cards

This document provides the model handoff cards for the remote-sensing specialists integrated into the SatQuery AI Workstation, in compliance with Appendix D of the Combined Architecture Execution Plan.

---

## 1. GeoChat / UniRS Specialist

*   **Name and version:** GeoChat-7B (v1.0)
*   **Repository and paper:** 
    *   Repository: [mbzuai-oryx/GeoChat](https://github.com/mbzuai-oryx/GeoChat)
    *   Paper: *GeoChat: Grounded Large Vision-Language Model for Remote Sensing* (CVPR 2024)
*   **License and weight terms:** Apache License 2.0 (weights are public on Hugging Face hub)
*   **Supported tasks:** VQA, Captioning, Bounding Box Grounding
*   **Input modalities:** OPTICAL, MULTISPECTRAL
*   **Accepted file shape:** Single image, 3-band RGB/Multispectral, GeoTIFF or benchmark PNG/JPEG
*   **Output JSON example:**
    ```json
    {
      "answer": "The target water reservoir is visible in the center of the image.",
      "evidence": [
        {
          "evidenceType": "IMAGE",
          "filePath": "uploads/optical.tif",
          "label": "Source Image Highlight",
          "description": "Core input used for visual question answering."
        }
      ],
      "limitations": ["VQA responses are based on visible spectrum properties."]
    }
    ```
*   **Evidence artifacts:** Bounding boxes, plain text annotations
*   **Known failure cases:** Sub-pixel classification anomalies around fine urban boundaries
*   **Runtime command:** `python model_server.py --model MBZUAI/geochat-7B --port 5000`
*   **Java adapter class:** [UniRSAdapter](file:///c:/Users/LENOVO/OneDrive/Documents/sat-query-sih/sat-query-sih/backend/src/main/java/com/satquery/client/UniRSAdapter.java)
*   **Evaluation sample:** `vrs-01` (VRSBench validation set)
*   **Owner:** Model/adaptation Lead

---

## 2. VisTA Change Specialist

*   **Name and version:** VisTA Change-QA (v1.1)
*   **Repository and paper:** 
    *   Repository: [like413/VisTA](https://github.com/like413/VisTA)
    *   Paper: *Show Me What and Where has Changed? Question Answering and Grounding for Remote Sensing Change Detection* (arXiv:2311.15826)
*   **License and weight terms:** Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)
*   **Supported tasks:** CHANGE_ANALYSIS
*   **Input modalities:** OPTICAL (Bi-temporal Pair)
*   **Accepted file shape:** Two co-registered optical images, EPSG:4326/UTM coordinate matches
*   **Output JSON example:**
    ```json
    {
      "answer": "New built-up residential structures expanded near the eastern boundary between dates.",
      "evidence": [
        {
          "evidenceType": "CHANGE_MAP",
          "filePath": "outputs/change.png",
          "label": "Spatiotemporal Change Map",
          "description": "Red overlay showing absolute pixel-level difference areas."
        }
      ],
      "limitations": ["Vegetation and shadow shifts due to seasonal cycles might show minor change noise."]
    }
    ```
*   **Evidence artifacts:** Pixel difference heatmaps (`CHANGE_MAP`)
*   **Known failure cases:** Cloud shadows or viewing angle shifts causing false positive change detections
*   **Runtime command:** `python model_server.py --model VisTA-CD --port 5000`
*   **Java adapter class:** [ChangeQaAdapter](file:///c:/Users/LENOVO/OneDrive/Documents/sat-query-sih/sat-query-sih/backend/src/main/java/com/satquery/client/ChangeQaAdapter.java)
*   **Evaluation sample:** `cdvqa-01` (CDVQA verification set)
*   **Owner:** Model/adaptation Lead

---

## 3. EarthGPT / multimodalCD Fusion Specialist

*   **Name and version:** EarthGPT-Fusion (v1.0)
*   **Repository and paper:** 
    *   Repository: [PatrickTUM/multimodalCD_ISPRS21](https://github.com/PatrickTUM/multimodalCD_ISPRS21)
    *   Paper: *Fusing Multi-modal Data for Supervised Change Detection* (ISPRS 2021)
*   **License and weight terms:** Academic/Research Use Only
*   **Supported tasks:** FUSION_ANALYSIS
*   **Input modalities:** OPTICAL + SAR
*   **Accepted file shape:** Paired images (1 Optical S2 + 1 SAR S1), coregistered, resampled to 10m grid
*   **Output JSON example:**
    ```json
    {
      "answer": "Fused analysis confirms shoreline flooding. Attenuation in radar backscatter maps standing water in cloudy regions.",
      "evidence": [
        {
          "evidenceType": "SENSOR_BRANCH",
          "filePath": "outputs/fusion.png",
          "label": "Fused Optical-SAR Composition",
          "description": "Alpha-blended composition overlaying SAR structural backscatter onto optical colors."
        }
      ],
      "limitations": ["SAR double-bounce effects may cause false positives in dense building clusters."]
    }
    ```
*   **Evidence artifacts:** Multimodal co-registered alpha blend overlays (`SENSOR_BRANCH`)
*   **Known failure cases:** Heavy terrain tilt causing geometric distortion in SAR backscatter layers
*   **Runtime command:** `python model_server.py --model EarthGPT-Fusion --port 5000`
*   **Java adapter class:** [EarthGptAdapter](file:///c:/Users/LENOVO/OneDrive/Documents/sat-query-sih/sat-query-sih/backend/src/main/java/com/satquery/client/EarthGptAdapter.java)
*   **Evaluation sample:** `rsvqa-01` (RSVQA dataset)
*   **Owner:** AI Integration Lead
