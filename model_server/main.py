from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
from registry import ModelRegistry

app = FastAPI(title="SatQuery AI Agentic Model Server")
registry = ModelRegistry()

class QueryRequest(BaseModel):
    task: str
    query: str
    images: List[str]
    parameters: Optional[dict] = None

@app.post("/analyze")
async def analyze_query(request: QueryRequest):
    try:
        print(f"[Model Server] Received Task: {request.task}")
        
        # 1. Agentic Orchestration: Route to the correct model
        specialized_model = registry.get_model(request.task)
        
        # 2. Execute Model Inference
        result = specialized_model.run(
            query=request.query,
            image_paths=request.images,
            params=request.parameters or {}
        )
        
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
