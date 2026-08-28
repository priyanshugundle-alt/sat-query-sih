# Third-Party Notices & License Matrix

This file documents the attributions, licensing, and reuse decisions for all external code, models, weights, and datasets referenced or adapted by the SatQuery AI Workstation.

---

## 1. Reference Repositories & Architecture

### RS-Agent
* **Repository:** [IntelliSensing/RS-Agent](https://github.com/IntelliSensing/RS-Agent)
* **License:** MIT License
* **Role in SatQuery:** Inspired the architectural separation of a central controller (`AgentController`) from dynamic toolkit handlers (`ToolRegistry`, `HandlerFactory`, polymorphic tasks, and trace observation).

### GeoChat
* **Repository:** [mbzuai-oryx/GeoChat](https://github.com/mbzuai-oryx/GeoChat)
* **License:** Apache License 2.0
* **Role in SatQuery:** Conceptual reference for single-image Remote-Sensing VQA, captioning, and referring-object grounding under specialist visual-language adapters (`UniRSAdapter`).

### VisTA
* **Repository:** [like413/VisTA](https://github.com/like413/VisTA)
* **License:** Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)
* **Role in SatQuery:** Inspired the "what changed?" plus "where did it change?" response design, return-plus-mask output structure, and multi-temporal change QA adapter (`ChangeQaAdapter`).

### MultimodalCD_ISPRS21
* **Repository:** [PatrickTUM/multimodalCD_ISPRS21](https://github.com/PatrickTUM/multimodalCD_ISPRS21)
* **License:** Academic/Research Use Only
* **Role in SatQuery:** Reference for Sentinel-1 (SAR) and Sentinel-2 (Optical) alignment metadata, grid resampling compatibility, and multi-modal fusion handler check workflows (`EarthGptAdapter`).

---

## 2. Remote-Sensing Datasets

### BigEarthNet v2.0
* **Source:** [BigEarthNet Portal](https://bigearth.net/)
* **License:** Creative Commons Attribution 4.0 International (CC BY 4.0)
* **Role in SatQuery:** Provided Sentinel-1 and Sentinel-2 image patches with multi-label land-cover annotations for downstream classifier model adaptation.

### VRSBench
* **Source:** [VRSBench Dataset](https://github.com/RSVQA/VRSBench)
* **License:** Research/Academic Use Only
* **Role in SatQuery:** Evaluation benchmark mapping dataset context for image captioning and visual question-answering.

### RSVQA
* **Source:** [RSVQA Project](https://rsvqa.lighton.ai/)
* **License:** Research/Academic Use Only
* **Role in SatQuery:** Ground truth remote-sensing question answering benchmark context.

### CDVQA
* **Source:** [CDVQA Dataset](https://github.com/CDVQA)
* **License:** Research/Academic Use Only
* **Role in SatQuery:** Multi-temporal change detection visual question-answering benchmark context.
