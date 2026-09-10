"""
SatQuery AI — Execution Audit Tracer & Analysis Receipt Generator
Records end-to-end reasoning traces, verification steps, and outputs audit receipts.
"""

import json
from pathlib import Path
import time
import uuid
from typing import Any, Dict, List, Optional

from agent.config import CONFIG


class AuditTracer:
    """
    Maintains an auditable, transparent execution ledger for every Agent interaction.
    """
    def __init__(self, log_dir: Path = CONFIG.audit_log_dir):
        self.log_dir = log_dir
        self.log_dir.mkdir(parents=True, exist_ok=True)

    def record_receipt(
        self,
        query: str,
        intent: str,
        input_info: Dict[str, Any],
        geo_validity: Dict[str, Any],
        selected_model: str,
        model_output: Dict[str, Any],
        verification: Dict[str, Any],
        final_answer: str,
        elapsed_ms: float
    ) -> Dict[str, Any]:
        receipt_id = f"SQ-{time.strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
        timestamp = time.strftime("%Y-%m-%d %H:%M:%S")

        receipt = {
            "receipt_id": receipt_id,
            "timestamp": timestamp,
            "query": query,
            "intent": intent,
            "input_metadata": input_info,
            "geo_validity_gate": {
                "status": geo_validity.get("status"),
                "passed_checks": [c["name"] for c in geo_validity.get("checks", []) if c.get("passed")]
            },
            "specialist_routing": {
                "selected_tool": selected_model,
                "model_version": model_output.get("model_version", "1.0.0"),
                "processing_time_ms": model_output.get("processing_time_ms", elapsed_ms)
            },
            "evidence_and_uncertainty": {
                "uncertainty_level": verification.get("uncertainty_level"),
                "confidence_score": verification.get("confidence_score"),
                "claims": verification.get("claims", [])
            },
            "final_answer": final_answer,
            "total_latency_ms": round(elapsed_ms, 2)
        }

        # Save to disk
        file_path = self.log_dir / f"receipt_{receipt_id}.json"
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(receipt, f, indent=2)

        return receipt

    def get_receipt(self, receipt_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves a receipt JSON from disk by receipt_id."""
        clean_id = receipt_id.replace("receipt_", "").replace(".json", "")
        path = self.log_dir / f"receipt_{clean_id}.json"
        if not path.exists():
            # Try direct file match
            direct = self.log_dir / f"{receipt_id}.json"
            if direct.exists():
                path = direct
            else:
                return None
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)

    def list_receipts(self, limit: int = 50) -> list:
        """Lists recent audit trace receipt files."""
        files = sorted(self.log_dir.glob("receipt_*.json"), key=lambda p: p.stat().st_mtime, reverse=True)
        return files[:limit]

