# SatQuery AI — SIH Judge Presentation Cheat Sheet

This cheat sheet provides demo scenarios, technical talking points, and Q&A strategies for presenting SatQuery AI at the Smart India Hackathon (SIH).

---

## 🎯 4 Core Demo Scenarios (Live Workstation Queries)

| Scenario | Task Type | Example Input Query | What to Highlight to Judges |
| :--- | :--- | :--- | :--- |
| **1. Single-Image VQA** | `VQA` | *"Describe the land-cover, agricultural, and urban features in this scene."* | Zero-shot visual reasoning, NIR reflectance observation, clear natural language response. |
| **2. Target Grounding** | `GROUNDING` | *"Highlight the main water reservoir boundary."* | Pixel-level spatial bounding box `[ymin, xmin, ymax, xmax]` drawn directly on UI canvas. |
| **3. Temporal Change** | `CHANGE_ANALYSIS` | *"What land cover changes occurred between Date 1 and Date 2?"* | Interactive Before/After slider overlay, pixel-level change difference percentage. |
| **4. Optical-SAR Fusion** | `FUSION_ANALYSIS` | *"Analyze cloudy sector using Sentinel-1 SAR and Sentinel-2 Optical data."* | Cloud cover penetration via Synthetic Aperture Radar (SAR) backscatter. |

---

## 💡 Key Architectural Strengths for Judges

1. **No-Spring-Boot Constraint:** Built using Java 21 standard library `HttpServer`, `HttpClient`, Jackson, and SQLite JDBC.
2. **Specialist AI Routers:** Modular design using `UniRSAdapter`, `ChangeQaAdapter`, and `EarthGptAdapter`.
3. **Qwen2-VL Primary Engine:** High-resolution dynamic satellite image input with native bounding box grounding.
4. **Honest Audit Caveats:** Automatic disclosure of limitations and uncertainty bounds for defendable scientific output.
5. **PDF & JSON Trace Reports:** Downloadable audit trail containing query step execution history.

---

## ❓ Probable Judge Q&A & Answers

- **Q: Why didn't you use standard GPT-4 / LLMs directly?**  
  *A:* Generic LLMs shrink high-res satellite photos to 224x224, losing roads and small buildings. We use **Qwen2-VL** which handles native dynamic resolution and outputs spatial bounding boxes.

- **Q: How do you handle cloud cover during monsoon?**  
  *A:* We implement **Optical-SAR Fusion (R4 Requirement)** using Sentinel-1 SAR radar imagery, which penetrates clouds and night darkness.

- **Q: Is your backend dependent on continuous internet/cloud services?**  
  *A:* No. The system features an automatic Fallback Engine running locally, ensuring 100% offline testability.
