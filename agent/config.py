"""
SatQuery AI — Central Agent Configuration
Defines routing intents, confidence thresholds, and uncertainty levels.
"""

from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Dict, List


class UncertaintyLevel(str, Enum):
    VERIFIED = "Verified"
    LIKELY = "Likely"
    UNCERTAIN = "Uncertain"
    INSUFFICIENT_EVIDENCE = "Insufficient Evidence"


class TaskIntent(str, Enum):
    SAR_CLASSIFICATION = "sar_classification"
    SAR_FEATURE_EXTRACTION = "sar_feature_extraction"
    CHANGE_DETECTION = "change_detection"
    VQA_REASONING = "vqa_reasoning"
    GEO_VALIDATION_ONLY = "geo_validation_only"
    MODEL_B_TASK = "model_b_task"
    MULTIMODAL_FUSION = "multimodal_fusion"
    UNKNOWN = "unknown"


@dataclass
class AgentConfig:
    # Confidence thresholds
    high_confidence_threshold: float = 0.75
    medium_confidence_threshold: float = 0.45
    change_detection_threshold: float = 0.88  # Cosine similarity below this = change detected
    
    # Audit log directory
    audit_log_dir: Path = Path(r"D:\SIH\sat-query-sih\agent\audit_logs")
    
    # Model A Checkpoint
    model_a_checkpoint: Path = Path(r"D:\SIH\sat-query-sih\model_a\checkpoints\best_model_a.pt")
    
    # Fallback to latest checkpoint if best not found
    model_a_latest_checkpoint: Path = Path(r"D:\SIH\sat-query-sih\model_a\checkpoints\latest_checkpoint.pt")


CONFIG = AgentConfig()
