"""
SatQuery AI — Official BigEarthNet 19-Class CORINE Nomenclature
Mapping, Label Encoders, and Class Weights
"""

from typing import Dict, List
import numpy as np

# Official 19 BigEarthNet class names (v2.0 / v1.0 standard)
CORINE_19_CLASSES: List[str] = [
    "Urban fabric",
    "Industrial or commercial units",
    "Arable land",
    "Permanent crops",
    "Pastures",
    "Complex cultivation patterns",
    "Land principally occupied by agriculture, with significant areas of natural vegetation",
    "Agro-forestry areas",
    "Broad-leaved forest",
    "Coniferous forest",
    "Mixed forest",
    "Natural grassland and sparsely vegetated areas",
    "Moors, heathland and sclerophyllous vegetation",
    "Transitional woodland, shrub",
    "Beaches, dunes, sands",
    "Inland wetlands",
    "Coastal wetlands",
    "Inland waters",
    "Marine waters"
]

CLASS_TO_IDX: Dict[str, int] = {cls_name: i for i, cls_name in enumerate(CORINE_19_CLASSES)}
IDX_TO_CLASS: Dict[int, str] = {i: cls_name for i, cls_name in enumerate(CORINE_19_CLASSES)}


def encode_labels(labels: List[str]) -> np.ndarray:
    """
    Encodes a list of textual class names into a multi-hot binary vector of length 19.
    """
    target = np.zeros(len(CORINE_19_CLASSES), dtype=np.float32)
    for label in labels:
        if label in CLASS_TO_IDX:
            target[CLASS_TO_IDX[label]] = 1.0
    return target


def decode_predictions(prob_vector: np.ndarray, threshold: float = 0.5) -> List[Dict[str, float]]:
    """
    Decodes a probability vector (19,) into predicted class names and confidence scores.
    """
    results = []
    for idx, prob in enumerate(prob_vector):
        if prob >= threshold:
            results.append({
                "class_name": IDX_TO_CLASS[idx],
                "confidence": float(prob)
            })
    return results
