from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
from registry import ModelRegistry

app = FastAPI(title="SatQuery AI Agentic Model Server")
registry = ModelRegistry()

class QueryRequest(BaseModel):
    task: Optional[str] = None
    query: Optional[str] = ""
    images: Optional[List[str]] = None
    image_paths: Optional[List[str]] = None
    parameters: Optional[dict] = None

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
        target_images = request.images or request.image_paths or []
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

if __name__ == "__main__":
    print("Starting SatQuery AI Agentic Model Server on port 5000...")
    uvicorn.run(app, host="0.0.0.0", port=5000)

