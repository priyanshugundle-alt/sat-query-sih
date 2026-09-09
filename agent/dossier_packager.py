"""
SatQuery AI — SIH Official Evaluation Dossier Packager
Phase 10 Capstone Module for SIH Problem Statement 26167 (ISRO / SAC)

Consolidates all competition deliverables into a unified, publication-grade
ZIP package: SatQuery_SIH_Evaluation_Dossier.zip.
"""

import json
import os
import platform
import shutil
import zipfile
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional
import torch

from model_a.config import CONFIG as MODEL_A_CONFIG


class SIHDossierPackager:
    """
    Automates the packaging of competition deliverables:
    - Master Handover PDF
    - System Architectural README
    - Automated Benchmark Reports (JSON & HTML)
    - Cryptographic Zero-Hallucination Audit Receipts
    - Hardware & Runtime Manifest
    """

    def __init__(self, root_dir: Optional[Path] = None):
        self.root_dir = root_dir or Path(r"D:\SIH\sat-query-sih")
        self.export_dir = self.root_dir / "exports"
        self.export_dir.mkdir(parents=True, exist_ok=True)
        self.zip_path = self.export_dir / "SatQuery_SIH_Evaluation_Dossier.zip"

    def _generate_system_manifest(self) -> Dict[str, Any]:
        """Generates comprehensive system manifest for evaluation judges."""
        gpu_name = torch.cuda.get_device_name(0) if torch.cuda.is_available() else "None (CPU Execution)"
        cuda_ver = torch.version.cuda if torch.cuda.is_available() else "N/A"

        manifest = {
            "title": "SatQuery AI — Competition Evaluation Manifest",
            "problem_statement": {
                "id": "26167",
                "title": "Natural Language Querying for Remote Sensing & Earth Observation",
                "organization": "Indian Space Research Organisation (ISRO) / Space Applications Centre (SAC)",
                "category": "Software / AI & Deep Learning for Geospatial Intelligence"
            },
            "timestamp": datetime.now().isoformat(),
            "runtime_environment": {
                "os": platform.platform(),
                "python_version": platform.python_version(),
                "torch_version": torch.__version__,
                "cuda_version": cuda_ver,
                "gpu_accelerator": gpu_name
            },
            "architecture_specs": {
                "model_a": {
                    "architecture": "ResNet18-SAR (Dual-Polarization Adapted)",
                    "pretrained_backbone": "resnet18",
                    "embedding_dimension": 512,
                    "num_classes": MODEL_A_CONFIG.dataset.num_classes,
                    "weights_path": str(self.root_dir / "model_a" / "checkpoints" / "best_model_a.pt")
                },
                "agent_orchestrator": {
                    "routing_engine": "Deterministic Regex Rule Engine + Multi-Specialist Dispatcher",
                    "geo_gatekeeper": "Active (16-bit GeoTIFF header, spatial validity, dynamic range checks)",
                    "vector_retrieval": "Dense 512-dim Normalized Cosine Embedding Index",
                    "explainability": "Grad-CAM Biophysical Radar Backscatter Heatmaps",
                    "session_store": "Multi-Turn Session Memory (LRU In-Memory + Thread-Safe)",
                    "audit_layer": "SHA-256 Cryptographic Zero-Hallucination Audit Logs"
                }
            },
            "phases_delivered": [
                "Phase 1: Environment & Tooling Verification",
                "Phase 2: BigEarthNet-S1 Dataset Pipeline & Integrity Gate",
                "Phase 3: Model A (ResNet18-SAR Dual-Pol Classifier)",
                "Phase 4: Model A Evaluation & Metric Verification",
                "Phase 5: 512-D Feature Encoder & High-Performance Extraction",
                "Phase 6: Multi-Tool Agent Orchestrator & Cryptographic Verification",
                "Phase 7: Production FastAPI Service & Modern Web Dashboard",
                "Phase 8: Multi-Turn Sessions, Demo Presets & Automated Benchmarking",
                "Phase 9: Semantic Geo-Search & Grad-CAM Explainable AI",
                "Phase 10: Geospatial ROI Sub-Patch Analytics & SIH Dossier Packager",
                "Phase 11: ISRO Bhuvan / QGIS Geospatial Vector Exporter & Model Registry",
                "Phase 12: Rapid Disaster & Crisis Response Engine",
                "Phase 13: Large-Area AOI Strip Mosaicing & Ground-Station Edge Model Optimization"
            ]
        }

        # Check latest benchmark results
        bm_path = self.root_dir / "benchmark_report.json"
        if bm_path.exists():
            try:
                with open(bm_path, "r", encoding="utf-8") as f:
                    bm_data = json.load(f)
                manifest["benchmark_metrics"] = bm_data.get("aggregate_metrics", {})
                manifest["benchmark_kpis"] = bm_data.get("kpi_summary", {})
            except Exception:
                pass

        return manifest

    def package_dossier(self) -> Dict[str, Any]:
        """
        Gathers all artifacts and builds the ZIP dossier.
        Returns a summary report of packaged contents.
        """
        manifest_data = self._generate_system_manifest()
        manifest_path = self.export_dir / "system_manifest.json"
        with open(manifest_path, "w", encoding="utf-8") as f:
            json.dump(manifest_data, f, indent=2)

        included_files: List[Dict[str, Any]] = []

        # Resolve PDF location (root or parent)
        pdf_path = self.root_dir / "SatQuery_Master_Handover_Document.pdf"
        if not pdf_path.exists() and (self.root_dir.parent / "SatQuery_Master_Handover_Document.pdf").exists():
            pdf_path = self.root_dir.parent / "SatQuery_Master_Handover_Document.pdf"

        # List of candidate files/directories to include
        items_to_zip = [
            ("SatQuery_Master_Handover_Document.pdf", pdf_path),
            ("README.md", self.root_dir / "README.md"),
            ("system_manifest.json", manifest_path),
            ("benchmark_report.json", self.root_dir / "benchmark_report.json"),
            ("benchmark_report.html", self.root_dir / "api" / "static" / "benchmark_report.html"),
        ]

        # Alternative location for benchmark report if at root
        if not (self.root_dir / "api" / "static" / "benchmark_report.html").exists() and (self.root_dir / "benchmark_report.html").exists():
            items_to_zip.append(("benchmark_report.html", self.root_dir / "benchmark_report.html"))

        with zipfile.ZipFile(self.zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
            # 1. Add top-level reports & documents
            for arcname, filepath in items_to_zip:
                if filepath.exists():
                    zf.write(filepath, arcname=f"SatQuery_Dossier/{arcname}")
                    included_files.append({
                        "filename": arcname,
                        "size_bytes": filepath.stat().st_size,
                        "description": "Core Report / Document"
                    })

            # 2. Add sample audit receipts from agent/audit_logs
            audit_dir = self.root_dir / "agent" / "audit_logs"
            if audit_dir.exists():
                receipt_count = 0
                for r_path in audit_dir.glob("receipt_SQ-*.json"):
                    zf.write(r_path, arcname=f"SatQuery_Dossier/audit_logs/{r_path.name}")
                    receipt_count += 1
                    if receipt_count >= 10:  # Include up to 10 latest JSON receipts
                        break

                pdf_receipt_count = 0
                for p_path in audit_dir.glob("receipt_SQ-*.pdf"):
                    zf.write(p_path, arcname=f"SatQuery_Dossier/audit_logs/{p_path.name}")
                    pdf_receipt_count += 1
                    if pdf_receipt_count >= 5:  # Include up to 5 latest PDF receipts
                        break

                included_files.append({
                    "filename": "audit_logs/",
                    "item_count": receipt_count + pdf_receipt_count,
                    "description": "Cryptographic Audit Logs & PDF Verification Receipts"
                })

            # 3. Add model evaluation metrics
            eval_metrics = self.root_dir / "model_a" / "evaluation_results.json"
            if eval_metrics.exists():
                zf.write(eval_metrics, arcname="SatQuery_Dossier/model_metrics/evaluation_results.json")
                included_files.append({
                    "filename": "model_metrics/evaluation_results.json",
                    "size_bytes": eval_metrics.stat().st_size,
                    "description": "Model-A ResNet18-SAR Test Split Validation Metrics"
                })

        zip_size_bytes = self.zip_path.stat().st_size

        return {
            "status": "success",
            "zip_path": str(self.zip_path),
            "filename": self.zip_path.name,
            "size_bytes": zip_size_bytes,
            "size_mb": round(zip_size_bytes / (1024 * 1024), 2),
            "generated_at": datetime.now().isoformat(),
            "included_artifacts": included_files,
            "system_manifest": manifest_data
        }


# Singleton instance
DOSSIER_PACKAGER = SIHDossierPackager()
