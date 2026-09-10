"""
SatQuery AI — Dynamic Model B Checkpoint Registry & Routing Mode Manager
Phase 11 Capstone Module for SIH Problem Statement 26167 (ISRO / SAC)

Manages multi-specialist AI backbones (Model A SAR, Model B Optical, Joint Fusion)
and enables runtime registration and hot-swapping of teammate model checkpoints.
"""

from enum import Enum
from pathlib import Path
from typing import Dict, Any, List, Optional
import torch


class RoutingMode(str, Enum):
    SAR_ONLY = "sar_only"           # Pure radar backscatter reasoning
    OPTICAL_ONLY = "optical_only"   # Pure optical spectral reflectance
    JOINT_FUSION = "joint_fusion"   # Joint 1024-dim corroboration & cross-sensor consensus


class SpecialistModelRegistry:
    """
    Central registry for multi-specialist models and checkpoints.
    Allows runtime inspection, model switching, and dynamic checkpoint loading.
    """

    def __init__(self):
        self.active_mode: RoutingMode = RoutingMode.JOINT_FUSION
        self._registered_models: Dict[str, Dict[str, Any]] = {
            "model_a": {
                "name": "Model A (ResNet-18 SAR Specialist)",
                "modality": "Radar (Sentinel-1 C-SAR Dual-Pol)",
                "architecture": "ResNet18-SAR",
                "in_channels": 2,
                "input_bands": ["VH", "VV"],
                "embedding_dim": 512,
                "num_classes": 19,
                "parameter_count": 11186515,
                "status": "ready",
                "checkpoint_path": str(Path(r"D:\SIH\sat-query-sih\model_a\checkpoints\best_model_a.pt"))
            },
            "model_b": {
                "name": "Model B (Sentinel-2 Optical Specialist)",
                "modality": "Optical / Multispectral (Sentinel-2 L2A)",
                "architecture": "ResNet18-Optical",
                "in_channels": 12,
                "input_bands": ["B01", "B02", "B03", "B04", "B05", "B06", "B07", "B08", "B8A", "B09", "B11", "B12"],
                "embedding_dim": 512,
                "num_classes": 19,
                "parameter_count": 11186515,
                "status": "ready (live weights loaded)",
                "checkpoint_path": str(Path(r"D:\SIH\SatQuery_S2_FINAL\model\best_model.pth"))
            },
            "unified_fusion": {
                "name": "SatQuery Unified Multi-Modal Fusion Model",
                "modality": "Joint SAR (Sentinel-1) + Optical (Sentinel-2)",
                "architecture": "SatQueryUnifiedFusionNet",
                "in_channels": "2 (SAR) + 12 (Optical)",
                "embedding_dim": 1024,
                "num_classes": 19,
                "status": "ready",
                "checkpoint_path": str(Path(r"D:\SIH\sat-query-sih\model_a\checkpoints\unified_fusion_model.pt"))
            }
        }

    def get_status(self) -> Dict[str, Any]:
        """Returns active routing mode and registered specialist models."""
        return {
            "active_mode": self.active_mode.value,
            "available_modes": [m.value for m in RoutingMode],
            "registered_models": self._registered_models,
            "joint_vector_dimension": 1024,
            "device": "cuda" if torch.cuda.is_available() else "cpu",
            "gpu_name": torch.cuda.get_device_name(0) if torch.cuda.is_available() else "CPU"
        }

    def set_routing_mode(self, mode: str) -> Dict[str, Any]:
        """Switches the active operational routing mode."""
        clean_mode = mode.lower().strip()
        matched = None
        for m in RoutingMode:
            if m.value == clean_mode:
                matched = m
                break
        if not matched:
            raise ValueError(f"Invalid mode '{mode}'. Choose from: {[m.value for m in RoutingMode]}")

        self.active_mode = matched
        desc = f"Routing mode successfully switched to '{self.active_mode.value}'."
        return {
            "status": "success",
            "active_mode": self.active_mode.value,
            "description": desc,
            "message": desc
        }

    def register_custom_checkpoint(
        self,
        model_id: str,
        display_name: str,
        checkpoint_path: str,
        modality: str = "Optical (Sentinel-2)",
        architecture: str = "Custom Checkpoint"
    ) -> Dict[str, Any]:
        """
        Validates and registers an external teammate PyTorch checkpoint.
        """
        p = Path(checkpoint_path)
        if not p.exists():
            raise FileNotFoundError(f"Checkpoint file not found: {p}")

        # Attempt to inspect PyTorch weights
        try:
            ckpt = torch.load(p, map_location="cpu", weights_only=False)
            keys = list(ckpt.keys()) if isinstance(ckpt, dict) else []
            state_dict = ckpt.get("model_state_dict", ckpt) if isinstance(ckpt, dict) else ckpt
            param_count = sum(v.numel() for v in state_dict.values()) if hasattr(state_dict, "values") else 0
        except Exception as e:
            raise ValueError(f"Failed to load PyTorch checkpoint: {str(e)}")

        self._registered_models[model_id] = {
            "name": display_name,
            "modality": modality,
            "architecture": architecture,
            "checkpoint_path": str(p),
            "file_size_mb": round(p.stat().st_size / (1024 * 1024), 2),
            "parameter_count": param_count,
            "status": "registered",
            "detected_keys": keys[:5]
        }

        return {
            "status": "success",
            "model_id": model_id,
            "registered_model": self._registered_models[model_id]
        }


# Global Singleton instance
MODEL_REGISTRY = SpecialistModelRegistry()
