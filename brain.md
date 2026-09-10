# 🧠 SatQuery AI — Project Brain & Master Memory (`brain.md`)

> **Note for AI Assistant / Agent:** Read this document at the start of any new session or task. It contains the complete state of the SatQuery AI project, architecture, progress, locked plans, and next steps.

---

## 📌 1. Project Overview & Objective

**Project Name:** SatQuery AI — Geospatial Workstation & Multi-Specialist RS-VLM Workstation  
**Domain:** Remote Sensing, Satellite Imagery Analysis, Vision-Language Models (VLM), Smart India Hackathon (SIH).  
**Objective:** Translate natural language queries about satellite imagery (Sentinel-1 SAR, Sentinel-2 Multispectral, Aerial RGB) into validated, routed, and evidence-backed spatial analysis.

---

## 🏗️ 2. Core System Architecture

SatQuery AI uses a **Decoupled Java Controller + Python Specialist VLM Architecture**:

```
+-----------------------------------------------------------------------------------+
|                            SatQuery Web Workstation (UI)                          |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                        Java 21 Core Backend (Port 8080)                           |
|  - AgentController (Central Router)                                              |
|  - SQLite Database (satquery.db - Traces & Telemetry)                              |
+-----------------------------------------------------------------------------------+
      |                                  |                                  |
      v                                  v                                  v
+------------------+           +------------------+           +------------------+
|  UniRSAdapter    |           |  EarthGptAdapter |           |  ChangeQaAdapter |
+------------------+           +------------------+           +------------------+
      |                                  |                                  |
      v (HTTP API)                       v (HTTP API)                       v (HTTP API)
+-----------------------------------------------------------------------------------+
|                 Python Multi-VLM Serving Engine (Port 8000)                        |
|                                                                                   |
|  [Specialist 1: GeoChat]      [Specialist 2: BigEarthNet]     [Specialist 3: VisTA]|
|  - Single Image RS-VQA        - SAR + Optical Fusion           - Multi-Temporal   |
|  - Object Bounding Box        - Land Cover Classification      - Change Detection |
|                                                                                   |
|  * Primary Foundation Training Dataset: BigEarthNet-MM (Sentinel-1 SAR 59GB +     |
|    Sentinel-2 Optical 51GB = 110GB Total Dataset)                                |
+-----------------------------------------------------------------------------------+
```

---

## 🛠️ 3. Tech Stack & Dependencies

* **Backend:** Java 21 (Built-in `HttpServer`, `HttpClient`) — **Zero Spring Boot** for judge-facing auditability.
* **Libraries:**
  * `Jackson Databind` (JSON parsing)
  * `Xerial SQLite JDBC` (Database telemetry in `satquery.db`)
  * `JUnit 5` (Automated testing)
* **Frontend:** Lightweight Vanilla HTML/CSS/JS client served on `http://localhost:8080/`.
* **AI/ML Layer:** PyTorch, Hugging Face Transformers, PEFT (LoRA/QLoRA), vLLM / FastAPI.

---

## 📂 4. Current Codebase Progress & Status

| Module / Component | Location | Status | Summary |
| :--- | :--- | :--- | :--- |
| **Java Core Server** | `backend/src/main/java/com/satquery/App.java` | ✅ Complete | Lightweight HTTP Server on port 8080. |
| **Agent Controller** | `backend/.../controller/AgentController.java` | ✅ Complete | Central query router dispatching to specialist adapters. |
| **Single-Image Adapter** | `backend/.../client/UniRSAdapter.java` | ✅ Complete | Adapter for GeoChat VQA & Grounding. |
| **Multi-Sensor Adapter** | `backend/.../client/EarthGptAdapter.java` | ✅ Complete | Adapter for Sentinel-1 SAR + Sentinel-2 Optical fusion. |
| **Change Detection Adapter**| `backend/.../client/ChangeQaAdapter.java` | ✅ Complete | Adapter for bi-temporal image pair comparison. |
| **Benchmark Validation** | `backend/.../benchmark/` | ✅ Complete | Validators for BigEarthNet, VRSBench, RSVQA, CDVQA. |
| **SQLite Telemetry DB** | `satquery.db` | ✅ Complete | Operational trace recorder & query logs. |
| **Frontend Workstation** | `frontend/` | ✅ Complete | Web UI interface. |
| **Multi-Tier Launch Scripts**| `start.ps1` / `start.bat` | ✅ Complete | Automated one-click launching of Python VLM Engine (8000), Java Backend (8080), and Web UI. |

---

## 🔒 5. Locked Multi-VLM Training & Strategy Plan

**Core Strategy:** Use **Task-Specialized VLMs** routed by Java `AgentController` (No single monolithic model).

1. **Land Cover & Sensor Fusion Specialist (EarthGptAdapter):**
   * **Dataset:** BigEarthNet-v2.0 (Sentinel-1 SAR 59GB + Sentinel-2 Optical 51GB).
   * **Kaggle Notebook:** [omkargatlewar/satquery-bigearthnet-vlm-specialist](https://www.kaggle.com/code/omkargatlewar/satquery-bigearthnet-vlm-specialist)
   * **Local Checkpoint:** `model_training/checkpoints/satquery_bigearthnet_lora.zip` (COMPLETE & DOWNLOADED ✅)
   * **Task:** Multi-label land-cover classification, cloud-resilient SAR + Optical analysis.

2. **RS-VQA & Grounding Specialist (UniRSAdapter):**
   * **Model:** GeoChat (MBZUAI).
   * **Dataset:** VRSBench & RSVQA.
   * **Kaggle Notebook:** [omkargatlewar/satquery-geochat-vlm-specialist](https://www.kaggle.com/code/omkargatlewar/satquery-geochat-vlm-specialist)
   * **Local Checkpoint:** `model_training/checkpoints/satquery_geochat_lora.zip` (COMPLETE & DOWNLOADED ✅)
   * **Task:** Visual Question Answering, object localization via bounding boxes `[ymin, xmin, ymax, xmax]`.

3. **Change Detection Specialist (ChangeQaAdapter):**
   * **Model:** VisTA.
   * **Dataset:** CDVQA.
   * **Kaggle Notebook:** [omkargatlewar/satquery-vista-vlm-specialist](https://www.kaggle.com/code/omkargatlewar/satquery-vista-vlm-specialist)
   * **Local Checkpoint:** `model_training/checkpoints/satquery_vista_lora.zip` (COMPLETE & DOWNLOADED ✅)
   * **Task:** Multi-temporal change analysis between Image T1 and Image T2.

---

## 🎯 6. Immediate Next Steps & Action Items

- [ ] **Step 1:** Complete downloading BigEarthNet archives (59GB Sentinel-1 + 51GB Sentinel-2).
- [ ] **Step 2:** Write `model_training/dataset_preprocessor.py` to extract, align 10m/20m/60m bands, normalize SAR decibels, and format JSONL VQA prompts.
- [ ] **Step 3:** Write `model_training/train_bigearthnet_specialist.py` for PyTorch LoRA fine-tuning.
- [ ] **Step 4:** Deploy `model_training/multi_vlm_server.py` on Port 8000.
- [ ] **Step 5:** Perform end-to-end integration testing via `SatQueryTest.java` and Web UI.
