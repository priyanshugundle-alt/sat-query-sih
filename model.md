# SatQuery AI - Deep Dive: Models & Architecture

## 1. Overall System Architecture (Path A)

SatQuery AI uses a **"Shared Feature Extractor + Task Heads"** architecture for its AI layer. Instead of running 7 entirely separate heavyweight neural networks or using a single text-generating LLM for everything, the system splits the visual processing from the downstream reasoning.

1. **Shared Vision Encoder (The Eyes)**: A single instance of Qwen-VL's vision backbone (`shared_encoder.py`) is loaded into GPU memory. This powerful model converts raw satellite imagery into dense mathematical embeddings (a 768-dimensional tensor) representing geographical features, edges, and objects.
2. **Task Heads (The Brains)**: Sitting on top of the shared encoder are 7 different PyTorch modules. Each model (e.g., `vqa_model.py`) is an independent `torch.nn.Module` with its own weights (`.pt`). These heads take the raw embeddings produced by Qwen and perform their specific downstream calculation.

```mermaid
graph TD
    UI[Frontend (React/Vite)] -->|User Query + Images| Java[Java Orchestrator :8080]
    Java -->|Validation & Routing| FastAPI[Python FastAPI :5000]
    
    FastAPI --> Registry[Model Registry]
    
    Registry --> Qwen[Shared Qwen Feature Extractor]
    
    Qwen -->|Image Embeddings| M1[VQA Task Head]
    Qwen -->|Image Embeddings| M2[Grounding Task Head]
    Qwen -->|Image Embeddings| M3[Captioning Task Head]
    Qwen -->|Image Embeddings| M4[Info Extraction Task Head]
    Qwen -->|Image Embeddings| M5[Change Analysis Task Head]
    Qwen -->|Image Embeddings| M6[Change Understanding Task Head]
    Qwen -->|Image Embeddings| M7[Fusion Analysis Task Head]
```

---

## 2. API Endpoint Design

All 7 models share a single, unified endpoint on the Python ML Server. The Java backend communicates with this endpoint, determining which wrapper to invoke via the `task` field.

### **Endpoint:** `POST http://localhost:5000/analyze`

**Request Payload:**
```json
{
  "task": "CHANGE_UNDERSTANDING",
  "query": "Explain the environmental impact of the changes seen in these two images.",
  "images": ["/uploads/image_2024.tif", "/uploads/image_2026.tif"],
  "parameters": {
    "resolution": "10m",
    "crs": "EPSG:4326"
  }
}
```

**Response Payload:**
```json
{
  "answer": "The model detected significant deforestation in the upper quadrant, likely leading to the increased sediment runoff visible in the river system.",
  "evidence": [
    {
      "type": "IMAGE",
      "filePath": "/uploads/image_2026.tif",
      "label": "Deforestation Highlight",
      "description": "Polygon mapping of removed forest cover."
    }
  ],
  "limitations": ["Cloud cover in the 2024 image obscures 15% of the region."]
}
```

---

## 3. The 7 Specialized Models (Detailed Breakdown)

### 1. Remote Sensing VQA (`VQA`)
* **Endpoint Task ID**: `VQA`
* **Architecture**: Direct natural language processing mapped to visual features. The wrapper injects a geographic context prompt to ensure Qwen answers using geospatial terminology rather than generic chat responses.
* **Process Flow**:
  1. Java verifies exactly **1 image** is provided.
  2. Python wrapper receives the image and user query.
  3. System Prompt appended: *"Act as an expert geospatial analyst. Answer the following question based purely on the provided satellite imagery."*
  4. Qwen-VL processes the text and visual tokens, outputting a direct answer.

### 2. Visual Grounding (`GROUNDING`)
* **Endpoint Task ID**: `GROUNDING`
* **Architecture**: Spatial coordinate mapping. The wrapper configures Qwen-VL to output bounding box coordinates `[ymin, xmin, ymax, xmax]` for objects rather than conversational text.
* **Process Flow**:
  1. Java verifies exactly **1 image** is provided.
  2. User asks: *"Highlight the commercial aircraft."*
  3. System Prompt appended: *"Identify the target objects and return precise bounding box coordinates in scaled format."*
  4. Qwen-VL returns coordinates. The Python wrapper translates these coordinates into GeoJSON or pixel overlays for the frontend to render.

### 3. Scene Captioning (`CAPTIONING`)
* **Endpoint Task ID**: `CAPTIONING`
* **Architecture**: Global image summarization. The wrapper ignores specific user questions and forces the model to perform a holistic sweep of the scene.
* **Process Flow**:
  1. Java verifies exactly **1 image** is provided.
  2. System Prompt appended: *"Generate a comprehensive, detailed geographic caption of this entire satellite scene. Include land cover types, infrastructure, and geographical features."*
  3. Qwen-VL outputs a dense paragraph. The Python wrapper packages it as the `answer`.

### 4. Information Extraction (`INFORMATION_EXTRACTION`)
* **Endpoint Task ID**: `INFORMATION_EXTRACTION`
* **Architecture**: Structured data parsing. The wrapper uses few-shot prompting to force Qwen to return JSON or bulleted lists of specific entities (e.g., counting cars, classifying crop types).
* **Process Flow**:
  1. Java verifies exactly **1 image** is provided.
  2. System Prompt appended: *"Extract the requested information and format the output as a strict numerical count or structured list. Do not include conversational filler."*
  3. Qwen-VL scans for the requested objects, and the wrapper validates the output format before sending it back to Java.

### 5. Change Analysis (`CHANGE_ANALYSIS`)
* **Endpoint Task ID**: `CHANGE_ANALYSIS`
* **Architecture**: Temporal image differencing. The wrapper stacks two temporal images as a sequence and instructs Qwen to perform pixel-level anomaly detection.
* **Process Flow**:
  1. Java verifies exactly **2 images** are provided, overlapping in coordinates, with different timestamps.
  2. System Prompt appended: *"Compare Image A (past) and Image B (present). Identify all physical and structural changes. Disignore lighting/shadow differences."*
  3. Qwen-VL outputs a list of changed regions.

### 6. Change Understanding (`CHANGE_UNDERSTANDING`)
* **Endpoint Task ID**: `CHANGE_UNDERSTANDING`
* **Architecture**: Semantic reasoning over temporal changes. While *Change Analysis* just finds "what" changed, this model explains "why" or "how" it matters.
* **Process Flow**:
  1. Java verifies exactly **2 images** are provided.
  2. System Prompt appended: *"You are an environmental and urban planning analyst. Review the changes between Image A and Image B. Explain the semantic meaning, potential causes, and environmental impact of these changes."*
  3. Qwen-VL generates a high-level analytical report (e.g., diagnosing urban sprawl or agricultural drought).

### 7. Optical-SAR Fusion (`FUSION_ANALYSIS`)
* **Endpoint Task ID**: `FUSION_ANALYSIS`
* **Architecture**: Cross-modality reasoning. The wrapper combines a standard optical image (RGB) with a Synthetic Aperture Radar (SAR) image. 
* **Process Flow**:
  1. Java verifies exactly **2 images** are provided: one tagged as `OPTICAL` and one tagged as `SAR`.
  2. System Prompt appended: *"Image A is Optical (affected by clouds). Image B is SAR (cloud-penetrating). Fuse the data from both to answer the user's query about the surface below."*
  3. Qwen-VL correlates the structural radar returns with the visible optical spectrum to deduce features hidden by weather or canopy.
