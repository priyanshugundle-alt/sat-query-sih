# SatQuery AI — Autonomous Earth Observation & Multi-Specialist Remote Sensing Agent

> **Smart India Hackathon (SIH) — Problem Statement 26167**  
> **Organization:** Indian Space Research Organisation (ISRO) / Space Applications Centre (SAC)  
> **Theme:** Space Technology / AI for Earth Observation  
> **Repository:** `d:\SIH\sat-query-sih`

---

## 1. Executive Summary

**SatQuery AI** is an enterprise-grade, agent-orchestrated Earth Observation (EO) AI platform engineered specifically for **SIH Problem Statement 26167**. The system enables conversational visual question answering, automated multi-label land-cover classification, bi-temporal change detection, and spatial evidence verification over pure dual-polarization GeoTIFF satellite rasters with **zero hallucination tolerance**.

Unlike black-box multimodal models that output ungrounded text, SatQuery AI enforces **deterministic physical grounding**: every claim made by the central reasoning agent is mathematically backed by sensor backscatter statistics, spectral cross-corroboration, and an immutable cryptographic **Audit Receipt (`SQ-YYYYMMDD-XXXXXX`)**.

---

## 2. Multi-Specialist Architecture

SatQuery AI is designed as a **decoupled multi-specialist system** orchestrated by an autonomous central agent:

```
                                  ┌────────────────────────┐
                                  │   SIH Judge / User     │
                                  └───────────┬────────────┘
                                              │
                    ┌─────────────────────────┴─────────────────────────┐
                    ▼                                                   ▼
       ┌────────────────────────┐                          ┌────────────────────────┐
       │  Web Dashboard (UI)    │                          │  REST API (FastAPI)    │
       │  api/static/index.html │                          │  api/server.py         │
       └────────────┬───────────┘                          └────────────┬───────────┘
                    │                                                   │
                    └─────────────────────────┬─────────────────────────┘
                                              ▼
                                ┌───────────────────────────┐
                                │   Central AI Agent        │
                                │   (agent/orchestrator.py) │
                                └─────────────┬─────────────┘
                                              │
        ┌───────────────────┬─────────────────┼─────────────────┬───────────────────┐
        ▼                   ▼                 ▼                 ▼                   ▼
┌──────────────┐    ┌──────────────┐   ┌──────────────┐  ┌──────────────┐    ┌──────────────┐
│ Geo-Validity │    │ Model A SAR  │   │ Model B Sim  │  │ Bi-Temporal  │    │ Multi-Turn   │
│ Gate (QA)    │    │ Specialist   │   │ Specialist   │  │ Change Engine│    │ Session Store│
│ CRS & Bounds │    │ ResNet-18    │   │ Optical/NDVI │  │ Cosine + ΔdB │    │ TTL Memory   │
└──────────────┘    └──────────────┘   └──────────────┘  └──────────────┘    └──────────────┘
```

### Core Architectural Modules

1. **Model A (SAR Specialist — ResNet-18)**:
   - Tailored 2-channel input stem processing dual-polarization Sentinel-1 radar ($\sigma^0_{VH}$, $\sigma^0_{VV}$).
   - Trained on **BigEarthNet-S1** (59.39 GB, 312 full acquisitions, 19 CORINE land-cover classes).
   - Zero spatial data leakage guarantee via strict acquisition-level partitioning (Train 70%, Val 15%, Test 15%).
2. **Geo-Validity Gate**:
   - Pre-inference gate verifying EPSG coordinate reference systems, pixel dimensions, NoData/NaN ratios ($<20\%$), and physical dB range constraints ($[-45\,\text{dB}, 0\,\text{dB}]$).
3. **Bi-Temporal SAR Change Studio**:
   - Compares paired acquisitions (T1 vs T2) using both semantic cosine distance on 512-dim embeddings and pixel-level backscatter amplitude drift ($\Delta\text{dB}$).
   - Generates automated hazard severity ratings for **deforestation alerts** and **flood inundation mapping**.
4. **512-Dimensional Feature Encoder**:
   - Extracts unit-normalized ($L_2 = 1.0 \pm 10^{-5}$) semantic feature vectors.
   - TorchScript JIT compiled for high-speed vector database ingestion (FAISS, Milvus, Qdrant).
5. **Multi-Modal Cross-Sensor Fusion Engine**:
   - Fuses SAR backscatter signatures with Optical spectral reflectance (NDVI/NDWI) into a **1024-dimensional joint feature space**.
   - Identifies sensor blindspots (e.g. optical cloud cover vs SAR all-weather penetration; sub-canopy water vs optical surface water).
6. **Multi-Turn Conversational Session Store**:
   - In-memory session tracking with 30-minute TTL expiry.
   - Retains active raster context across follow-up queries without re-uploading large GeoTIFFs.
7. **Immutable Audit Ledger**:
   - Produces machine-readable JSON and publication-quality PDF audit receipts storing exact tool execution times, confidence ratings, and physical evidence claims.
8. **Geospatial ROI Sub-Patch Analytics Engine**:
   - Interactive drag-and-drop bounding box inspection on Sentinel-1 rasters.
   - Computes localized radar decibel statistics ($\sigma^0_{VH}$, $\sigma^0_{VV}$), cross-polarization ratio ($VH/VV$), electromagnetic surface roughness regime (Specular vs Diffuse vs Volumetric), and dielectric constant / soil moisture proxy.
9. **SIH Official Evaluation Dossier Packager**:
   - One-click consolidation of the publication-grade Master Handover PDF, system architecture guide, automated benchmark reports (JSON & HTML), cryptographic audit logs, and runtime hardware manifest into `SatQuery_SIH_Evaluation_Dossier.zip`.
10. **ISRO Bhuvan / QGIS Geospatial Vector Exporter**:
    - Converts satellite scenes and detections into geodetic RFC 7946 GeoJSON FeatureCollections in WGS 84 (`EPSG:4326`).
    - Ready for instant drag-and-drop ingestion into **ISRO Bhuvan Geoportal**, **QGIS**, **ArcGIS Pro**, or Google Earth.
11. **Dynamic Model B Checkpoint Registry**:
    - Multi-specialist AI backbone manager supporting runtime mode toggling (`sar_only`, `optical_only`, `joint_fusion`) and hot-swapping teammate PyTorch checkpoints (`.pt` / `.pth`).
12. **Rapid Disaster & Crisis Response Engine**:
    - Automated microwave specular water segmentation via dual-polarization thresholding ($\sigma^0_{VV} < -18\,\text{dB}$), bi-temporal flood delta mapping, agricultural & urban exposure quantification, and official ISRO emergency PDF reports.
13. **Large-Area AOI Strip Mosaicing & Regional Analytics**:
    - Automated geographic stitching of multiple adjacent Sentinel-1 SAR tiles along an orbital acquisition swath, computing composite WGS-84 footprint envelopes, stitched false-color previews, and regional aggregated land-cover distribution statistics.
14. **Ground-Station Edge Model Optimization**:
    - Post-training dynamic INT8 quantization (`torch.quantization.quantize_dynamic`) of Model A ResNet-18 SAR specialist, measuring memory footprint reduction (~72.8% reduction from 44.8 MB to ~12.2 MB) and comparative inference latency benchmarking (FP32 vs INT8).

---

## 3. Quick Start & Execution

### Prerequisites
- Windows 10/11 or Linux
- Python 3.10+ (Tested on Python 3.12 with PyTorch 2.6.0+cu124)
- 4 GB+ VRAM (Optimized for NVIDIA RTX 3050 Laptop GPU with AMP)
- BigEarthNet-S1 dataset located at `d:\SIH\BigEarthNet-S1`

### Method 1: One-Click Startup (Recommended)
Double-click the pre-configured Windows launcher:
```bat
run_satquery.bat
```
*This launches the FastAPI microservice on `http://127.0.0.1:8000` and automatically opens your default web browser.*

### Method 2: Manual CLI Launch
```powershell
# 1. Activate project virtual environment
d:\SIH\sat-query-sih\.venv\Scripts\Activate.ps1

# 2. Launch FastAPI server
python -m uvicorn api.server:app --host 0.0.0.0 --port 8000 --reload
```
Navigate to:
- **Interactive Dashboard:** `http://localhost:8000`
- **Interactive OpenAPI Docs:** `http://localhost:8000/docs`
- **Benchmark Report:** `http://localhost:8000/api/benchmark/report`
- **One-Click Dossier Download:** `http://localhost:8000/api/export/dossier`

---

## 4. Web Dashboard Studios

The SatQuery web interface features 10 specialized operational studios:

| Studio | Tab Name | Functionality |
|---|---|---|
| **Studio 1** | **EO Visual Query & Land Cover** | Select BigEarthNet-S1 patches or upload custom GeoTIFFs; view dual-polarization false-color imagery; toggle live **Grad-CAM Saliency Heatmaps**; **drag-and-drop ROI canvas** for localized sub-patch decibel stats and roughness biophysics; ask natural language questions with specialist routing and multi-turn context. |
| **Studio 2** | **Bi-Temporal Change Studio** | Select two temporal acquisitions (T1 & T2); compute cosine similarity and pixel-level backscatter delta ($\Delta\text{dB}$); view natural language change explanation. |
| **Studio 3** | **512-dim Feature Encoder** | Extract normalized 512-dimensional semantic embeddings; inspect unit-norm stability; view vector heatmap. |
| **Studio 4** | **Audit Trace Ledger** | Inspect deterministic execution receipts (`SQ-YYYYMMDD-XXXXXX`); view JSON trace; download official publication-grade PDF receipts. |
| **Studio 5** | **Multi-Modal Fusion Studio** | Joint Sentinel-1 SAR + Sentinel-2 Optical analysis; 1024-dim joint vector synthesis; cross-sensor corroboration; access **7 SIH Judge Demo Presets**. |
| **Studio 6** | **Automated Benchmark Suite** | One-click automated evaluation across 5 to 50 real satellite rasters; real-time KPI progress bars; live embedded HTML benchmark report. |
| **Studio 7** | **Semantic Geo-Search** | Sub-millisecond dense retrieval across the BigEarthNet-S1 catalog; query by patch or target classes; inspect nearest neighbor matches with percentage gauges and one-click studio routing. |
| **Studio 8** | **GIS Map & GeoJSON Studio** | Interactive Leaflet satellite map with Esri imagery, WGS 84 footprint outlines, centroid coordinates, and one-click RFC 7946 GeoJSON export for **ISRO Bhuvan / QGIS**. |
| **Studio 9** | **Disaster & Flood Response** | Automated microwave water segmentation, bi-temporal flood delta mapping, agricultural & urban exposure calculation, interactive threshold slider, and official ISRO emergency PDF reports. |
| **Studio 10** | **AOI Strip Mosaic & Edge Engine** | Multi-patch AOI strip mosaicing, dynamic composite false-color preview, regional land-cover breakdown with hectare metrics, and ground-station dynamic INT8 edge quantization benchmark runner. |

---

## 5. REST API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/health` | `GET` | Health check, CUDA availability, Model A load status, dataset paths. |
| `/api/classes` | `GET` | Returns 19 CORINE land-cover classes and RGB color mapping. |
| `/api/patches/sample` | `GET` | Returns catalog of pre-indexed BigEarthNet-S1 patches. |
| `/api/patches/{patch_id}/preview` | `GET` | Generates dynamic 3-channel false-color PNG preview from raw 16-bit GeoTIFFs. |
| `/api/patches/{patch_id}/saliency` | `GET` | Computes Model A Grad-CAM spatial attribution heatmap on layer4 and returns blended PNG. |
| `/api/patches/{patch_id}/saliency/meta` | `GET` | Returns attribution metadata (target class, confidence, activation map URL). |
| `/api/patches/{patch_id}/geojson` | `GET` | Returns RFC 7946 GeoJSON polygon for patch with biophysical metadata (ISRO Bhuvan / QGIS). |
| `/api/export/geojson` | `POST` | Generates customized GeoJSON for any patch or sub-patch ROI. |
| `/api/disaster/flood-map` | `POST` | Rapid disaster water segmentation, bi-temporal flood delta, and exposure analysis. |
| `/api/disaster/flood-mask/{patch_id}` | `GET` | Returns high-contrast RGBA PNG flood mask (deep blue permanent + neon cyan flooded). |
| `/api/disaster/report/{patch_id}/pdf` | `GET` | Downloads official ISRO SAC Emergency Flood Inundation Report PDF. |
| `/api/disaster/export-geojson` | `POST` | Exports RFC 7946 GeoJSON with flood extent attributes for ISRO Bhuvan Geoportal. |
| `/api/mosaic/create` | `POST` | Stitches multi-patch AOI swath, computes composite footprint and regional statistics. |
| `/api/mosaic/preview` | `GET` | Streams latest stitched AOI false-color composite PNG image. |
| `/api/mosaic/export-geojson` | `POST` | Exports composite multi-tile AOI footprint GeoJSON for GIS integration. |
| `/api/edge/benchmark` | `POST` | Executes FP32 vs dynamic INT8 quantization benchmark for edge ground-stations. |
| `/api/edge/status` | `GET` | Returns edge quantization metrics, model footprint, and edge readiness status. |
| `/api/timeseries/analyze` | `POST` | Multi-temporal polarimetric trajectory tracking, RVI calculation, and physical anomaly scoring. |
| `/api/stac/catalog` | `GET` | Returns OGC STAC v1.0.0 Root Catalog describing collections and capabilities. |
| `/api/stac/collections` | `GET` | Lists available OGC STAC v1.0.0 collections with spatial/temporal extents. |
| `/api/stac/search` | `POST` | Standard OGC STAC v1.0.0 Item search supporting bounding box, datetime range, and text queries. |
| `/api/stac/items/{item_id}` | `GET` | Returns compliant STAC Item GeoJSON with SAR and EO extensions for a single patch. |
| `/api/alerts/evaluate` | `POST` | Evaluates radar telemetry against ISRO thresholds and dispatches formal Mission Alert Bulletins. |
| `/api/models/status` | `GET` | Returns registered models, active routing mode, and GPU specs. |
| `/api/models/mode` | `POST` | Switches active AI routing between 'sar_only', 'optical_only', and 'joint_fusion'. |
| `/api/models/register` | `POST` | Registers an external teammate PyTorch checkpoint (.pt / .pth) dynamically. |
| `/api/search/similar` | `POST` | Finds Top-K most semantically similar satellite patches using 512-dim embeddings. |
| `/api/search/classes` | `POST` | Finds satellite patches containing specified target CORINE land-cover categories. |
| `/api/search/stats` | `GET` | Returns metadata about the active vector index (count, dimension, device). |
| `/api/roi/analyze` | `POST` | Computes localized radar biophysics (mean/min/max/std dB, roughness, moisture) for a bounding box. |
| `/api/export/dossier` | `GET` | Compiles and streams the complete SIH Evaluation Dossier ZIP package. |
| `/api/query` | `POST` | Primary Agent entrypoint: processes query, routes specialist, returns synthesized answer + receipt. |
| `/api/change-detection` | `POST` | Bi-temporal change detection comparing two SAR acquisitions. |
| `/api/encode` | `POST` | Extracts 512-dim unit-normalized feature vector from SAR rasters. |
| `/api/multimodal-query` | `POST` | Joint SAR + Optical multimodal fusion query (1024-dim vector). |
| `/api/demo-presets` | `GET` | Returns 7 curated SIH evaluation scenarios. |
| `/api/receipts` | `GET` | Lists all immutable audit receipts generated in this deployment. |
| `/api/receipts/{receipt_id}` | `GET` | Retrieves full JSON payload of a specific audit receipt. |
| `/api/receipts/{receipt_id}/pdf` | `GET` | Serves downloadable official PDF audit document. |
| `/api/sessions` | `GET` | Lists active multi-turn conversation sessions. |
| `/api/sessions/{session_id}` | `GET` | Inspects full multi-turn conversation history. |
| `/api/sessions/{session_id}` | `DELETE` | Clears a session and its retained raster context. |
| `/api/benchmark` | `POST` | Triggers live benchmark suite against real satellite rasters. |
| `/api/benchmark/report` | `GET` | Serves the styled, judge-ready HTML benchmark report. |
| `/api/benchmark/latest` | `GET` | Returns the latest in-memory benchmark metrics JSON. |
| `/api/fusion/s1-s2/fuse` | `POST` | Fuses S1 SAR & S2 Optical into 1024-dim joint vector with cross-attention weights. |
| `/api/fusion/qwen-vl/project` | `POST` | Projects fused representations into 2048-dim visual prefix tokens for Qwen 2.5-VL 3B. |
| `/api/fusion/s1-export` | `GET` | Generates S1 Encoder Integration Contract JSON and standalone python extractor. |
| `/api/fusion/download-bundle` | `GET` | Downloads complete pre-packaged S1 Integration Bundle (.zip) for teammate laptop. |

---

## 6. SIH Judge Evaluation Presets

SatQuery AI includes **7 one-click presets** accessible from Studio 5:

1. **Forestry & Canopy Structure:** Identifies continuous canopy and dense vegetation via SAR cross-polarization ($VH$) volumetric scatter.
2. **Water Bodies & Wetlands:** Detects specular reflection surface signatures characteristic of standing water and reservoir boundaries.
3. **Urban Settlements & Infrastructure:** Maps built environments using high backscatter and radar double-bounce signatures.
4. **Bi-Temporal: Deforestation Early Warning:** Detects vegetation removal between two temporal acquisitions (ISRO forestry monitoring).
5. **Bi-Temporal: Flood Inundation Mapping:** Maps flood extent and surface water expansion for disaster relief coordination.
6. **Multi-Modal: Optical + SAR Vegetation Biophysics:** Combines optical NDVI with SAR volumetric backscatter for robust vegetation health assessment.
7. **Vector DB Semantic Encoding:** Extracts 512-dim unit-normalized vector ready for downstream indexing and retrieval.

---

## 7. SIH 26167 Benchmark Results

Evaluated against real BigEarthNet-S1 GeoTIFF patches on NVIDIA RTX 3050:

| Metric Category | Target Threshold | Measured Score | Status |
|---|---|---|---|
| **Intent Routing Accuracy** | $\ge 80.0\%$ | **100.0%** (6/6 canonical intents) | **PASS** |
| **Geo-Validity Gate Precision** | $100.0\%$ | **100.0%** (valid pass & invalid reject) | **PASS** |
| **ResNet-18 VQA Detection Rate** | $\ge 90.0\%$ | **100.0%** across real rasters | **PASS** |
| **Mean Inference Latency (P50)** | $< 100\,\text{ms}$ | **28.4 ms** (CUDA AMP) | **PASS** |
| **Peak Inference Latency (P95)** | $< 300\,\text{ms}$ | **56.2 ms** (CUDA AMP) | **PASS** |
| **SAR Feature Norm Stability** | L2 error $< 10^{-4}$ | **$0.00000$** (perfect unit norm) | **PASS** |
| **Change Detector Identity Invariance**| Similarity $\ge 0.999$ | **1.000000** on identical patches | **PASS** |

---

## 8. Directory Structure

```
d:/SIH/sat-query-sih/
├── agent/                         # Central Agent & Reasoning Engines
│   ├── orchestrator.py            # SatQueryAgent central dispatcher
│   ├── geo_validator.py           # Geo-Validity Gate (CRS, bounds, NaN)
│   ├── change_detector.py         # Bi-temporal SAR change engine
│   ├── evidence_verifier.py       # Claim-to-sensor fact mapping
│   ├── multimodal_fusion.py       # 1024-dim joint Optical+SAR fusion
│   ├── model_b_adapter.py         # Model B optical specialist simulator
│   ├── session_store.py           # Multi-turn conversational memory
│   ├── benchmark_suite.py         # Automated evaluation runner & HTML generator
│   ├── vector_search.py           # Dense 512-dim vector retrieval engine
│   ├── explainability.py          # Grad-CAM spatial explainability engine
│   ├── roi_analyzer.py            # Sub-patch localized radar biophysics
│   ├── disaster_engine.py         # Microwave water segmentation & flood delta engine
│   ├── mosaic_engine.py           # Multi-patch AOI strip mosaicing & regional analytics
│   ├── edge_optimizer.py          # Dynamic INT8 ground-station edge quantization
│   ├── timeseries_engine.py       # Multi-temporal polarimetric trajectory & anomaly engine
│   ├── stac_engine.py             # OGC STAC v1.0.0 Root Catalog & Spatio-Temporal API
│   ├── alert_engine.py            # Automated ISRO Mission Alert Bulletin generator (SHA-256)
│   └── dossier_packager.py        # Automated SIH evaluation ZIP dossier compiler
├── exports/                       # Compiled evaluation ZIP dossiers
├── api/                           # FastAPI Microservice & Frontend
│   ├── server.py                  # REST API endpoints & lifecycle management
│   ├── schemas.py                 # Pydantic v2 request/response models
│   └── static/                    # Glassmorphic Interactive Dashboard
│       ├── index.html             # Single-page application shell
│       ├── app.js                 # Dynamic client-side logic
│       ├── styles.css             # Responsive design system
│       └── benchmark_report.html  # Generated benchmark report
├── model_a/                       # Model A Specialist (ResNet-18 SAR)
│   ├── config.py                  # SAR normalization & hyper-parameters
│   ├── encoder.py                 # Standalone 512-dim feature extractor
│   ├── evaluate.py                # Validation & metric export scripts
│   ├── inference.py               # Optimized single-patch predictor
│   ├── train.py                   # PyTorch AMP training loop
│   ├── data/                      # Dataset, DataLoaders, & zero-leakage splits
│   └── models/                    # 2-channel ResNet-18 neural architecture
├── audit_logs/                    # Immutable audit receipts & PDF ledger
├── generate_handover_pdf.py       # Professional handover document generator
├── run_satquery.bat               # Windows one-click production launcher
└── README.md                      # Complete system documentation
```

---

## 9. Team & Competition Credits

- **Project:** SatQuery AI — Autonomous Earth Observation Specialist Agent
- **Problem Statement:** SIH 26167 (ISRO / Space Applications Centre)
- **Built for:** Smart India Hackathon (SIH) 2024–2025
- **License:** Proprietary — For Official SIH Evaluation
