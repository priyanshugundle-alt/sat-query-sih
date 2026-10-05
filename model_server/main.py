import os
import sys
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
from registry import ModelRegistry

app = FastAPI(title="SatQuery AI Agentic Model Server")
registry = ModelRegistry()

class QueryRequest(BaseModel):
    job_id: Optional[str] = None
    resume_stage: Optional[str] = "UPLOADED"
    task: Optional[str] = None
    query: Optional[str] = ""
    images: Optional[List[str]] = None
    image_paths: Optional[List[str]] = None
    parameters: Optional[dict] = None
    cached_metadata: Optional[dict] = None
    previous_turns: Optional[List[dict]] = None

@app.post("/analyze")
@app.post("/api/query")
@app.post("/api/roi/analyze")
@app.post("/api/change-detection")
@app.post("/api/multimodal-query")
async def analyze_query(request: QueryRequest, req: Request):
    try:
        path = req.url.path
        task = request.task
        
        # Auto-infer task from URL route if missing
        if not task:
            if "roi" in path:
                task = "GROUNDING"
            elif "change" in path:
                task = "CHANGE_ANALYSIS"
            elif "multimodal" in path:
                task = "FUSION_ANALYSIS"
            else:
                task = "VQA"
        
        print(f"[Model Server] Path: {path} -> Routed Task: {task}")
        
        # 1. Agentic Orchestration: Route to the correct model
        specialized_model = registry.get_model(task)
        
        # 2. Execute Model Inference
        raw_images = request.images or request.image_paths or []
        target_images = []
        import base64, tempfile, uuid
        for idx, img_item in enumerate(raw_images):
            if isinstance(img_item, str) and (img_item.startswith("data:image") or len(img_item) > 500):
                try:
                    img_data = img_item.split(",", 1)[1] if "," in img_item else img_item
                    raw_bytes = base64.b64decode(img_data)
                    tmp_file = Path(tempfile.gettempdir()) / f"satquery_upload_{idx}_{uuid.uuid4().hex[:6]}.png"
                    with open(tmp_file, "wb") as f:
                        f.write(raw_bytes)
                    target_images.append(str(tmp_file))
                except Exception as ex:
                    print(f"[Model Server] Base64 decode notice: {ex}")
                    target_images.append(img_item)
            else:
                target_images.append(img_item)

        result = specialized_model.run(
            query=request.query or "",
            image_paths=target_images,
            params=request.parameters or {}
        )

        
        # Ensure evidence objects have evidenceType for com.satquery.model.Evidence compatibility
        if "evidence" in result and isinstance(result["evidence"], list):
            for ev in result["evidence"]:
                if isinstance(ev, dict) and "type" in ev and "evidenceType" not in ev:
                    ev["evidenceType"] = ev["type"]
        
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        print(f"[Model Server Error]: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Model Error")

@app.get("/health")
def health_check():
    return {"status": "ONLINE", "models_loaded": len(registry.models)}

@app.post("/api/preview")
def generate_preview(req: dict):
    import os
    filename = req.get("filename")
    image_path = req.get("image_path")
    if not image_path and filename:
        candidates = [
            os.path.join("..", "uploads", filename),
            os.path.join("..", "backend", "uploads", filename),
            os.path.join("uploads", filename),
            os.path.join("backend", "uploads", filename)
        ]
        for c in candidates:
            if os.path.exists(c):
                image_path = c
                break
    if not image_path or not os.path.exists(image_path):
        return {"status": "NOT_FOUND"}
    
    try:
        from PIL import Image
        import numpy as np
        im = Image.open(image_path)
        arr = np.array(im, dtype=np.float32)
        if arr.ndim == 2:
            norm = ((arr - arr.min()) / (arr.max() - arr.min() + 1e-6) * 255.0).clip(0, 255).astype(np.uint8)
            out_img = Image.fromarray(norm)
        elif arr.ndim == 3:
            if arr.shape[0] in [1, 3, 4] and arr.shape[2] not in [1, 3, 4]:
                arr = np.transpose(arr, (1, 2, 0))
            channels = []
            for c in range(min(arr.shape[2], 3)):
                ch = arr[:, :, c]
                ch_norm = ((ch - ch.min()) / (ch.max() - ch.min() + 1e-6) * 255.0).clip(0, 255).astype(np.uint8)
                channels.append(ch_norm)
            if len(channels) == 1:
                out_img = Image.fromarray(channels[0])
            else:
                out_img = Image.fromarray(np.stack(channels, axis=-1))
        
        preview_path = image_path + ".png"
        out_img.save(preview_path)
        return {"status": "SUCCESS", "preview_path": preview_path, "previewUrl": f"/uploads/{os.path.basename(preview_path)}"}
    except Exception as e:
        return {"status": "ERROR", "error": str(e)}

if __name__ == "__main__":
    print("Starting SatQuery AI Agentic Model Server on port 5000...")
    uvicorn.run(app, host="0.0.0.0", port=5000)

