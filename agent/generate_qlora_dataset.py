"""
SatQuery AI — Remote Sensing Instruction Dataset Generator for QLoRA Fine-Tuning
Generates synthetic & metadata-grounded multi-turn instruction QA pairs from BigEarthNet-S1
and CORINE 19 classes for fine-tuning Vision-Language & Remote Sensing Reasoning Models.
"""

import json
import os
import random
from pathlib import Path
from typing import Dict, List, Any

BASE_DIR = Path(__file__).resolve().parent.parent
from model_a.data.corine_classes import CORINE_19_CLASSES

TEMPLATES = [
    {
        "instruction": "Analyze the land-cover distribution and dominant terrain features for this satellite scene.",
        "response_template": "Based on satellite dual-polarization SAR backscatter and cross-sensor analysis, this scene predominantly contains {classes}. Radar volumetric depolarization in the VH channel confirms {canopy_desc}, while the VV backscatter indicates {roughness_desc}."
    },
    {
        "instruction": "Is there any evidence of water bodies, wetlands, or flood inundation in this observation?",
        "response_template": "{water_desc} The SAR VV backscatter shows {vv_water_note}, characteristic of microwave specular reflection over open water."
    },
    {
        "instruction": "Assess the environmental and vegetation biophysics of this area.",
        "response_template": "Vegetation biophysical analysis indicates {veg_desc}. Radar cross-ratio (VH/VV) is estimated at {cross_ratio:.2f} dB, corroborating healthy canopy structure with minimal water-stress."
    },
    {
        "instruction": "What are the primary anthropogenic and infrastructure characteristics present?",
        "response_template": "{urban_desc} Radar backscatter double-bounce signals from hard orthogonal surfaces are {urban_sig}."
    }
]


def generate_dataset(
    output_path: Path = BASE_DIR / "model_a" / "data" / "qlora_training_data.json",
    num_samples: int = 500
):
    print(f"Generating {num_samples} remote sensing instruction pairs for QLoRA...")
    rng = random.Random(42)
    data = []

    for i in range(num_samples):
        # Pick 1 to 3 random realistic classes
        k = rng.choice([1, 2, 3])
        sample_classes = rng.sample(CORINE_19_CLASSES, k)
        classes_str = ", ".join(sample_classes)

        has_water = any("water" in c.lower() or "wetland" in c.lower() for c in sample_classes)
        has_urban = any("urban" in c.lower() or "industrial" in c.lower() for c in sample_classes)
        has_forest = any("forest" in c.lower() or "woodland" in c.lower() for c in sample_classes)

        # Template 1
        canopy = "dense multi-layered vegetation canopy" if has_forest else "sparse or non-woody ground cover"
        roughness = "high diffuse scattering characteristic of rough terrain" if has_forest else "moderate surface roughness"
        resp1 = TEMPLATES[0]["response_template"].format(
            classes=classes_str,
            canopy_desc=canopy,
            roughness_desc=roughness
        )
        data.append({
            "id": f"sq-inst-{len(data)+1:05d}",
            "instruction": TEMPLATES[0]["instruction"],
            "input": f"Detected Classes: {classes_str}. Mean VV: {rng.uniform(-16, -9):.2f} dB, Mean VH: {rng.uniform(-24, -15):.2f} dB.",
            "output": resp1
        })

        # Template 2
        if has_water:
            water_desc = f"Yes, positive evidence of surface water or wetland features was identified ({', '.join([c for c in sample_classes if 'water' in c.lower() or 'wetland' in c.lower()])})."
            vv_note = "distinct low return values (below -18.0 dB)"
        else:
            water_desc = "No prominent open water bodies or extensive surface inundation are detected in this immediate patch."
            vv_note = "no significant specular absorption signatures"
        resp2 = TEMPLATES[1]["response_template"].format(
            water_desc=water_desc,
            vv_water_note=vv_note
        )
        data.append({
            "id": f"sq-inst-{len(data)+1:05d}",
            "instruction": TEMPLATES[1]["instruction"],
            "input": f"Classes: {classes_str}.",
            "output": resp2
        })

        # Template 3
        veg = "moderate to high photosynthetic activity and robust canopy" if has_forest else "predominantly agricultural or grassland vegetation cover"
        resp3 = TEMPLATES[2]["response_template"].format(
            veg_desc=veg,
            cross_ratio=rng.uniform(-8.5, -4.2)
        )
        data.append({
            "id": f"sq-inst-{len(data)+1:05d}",
            "instruction": TEMPLATES[2]["instruction"],
            "input": f"Classes: {classes_str}.",
            "output": resp3
        })

        # Template 4
        if has_urban:
            urban_desc = "Significant urban fabric or industrial/commercial infrastructure is detected within the spatial footprint."
            urban_sig = "prominently visible with high backscatter intensity (-6.0 dB to -10.0 dB)"
        else:
            urban_desc = "The region is predominantly rural, natural, or agricultural with minimal built-up infrastructure."
            urban_sig = "absent or negligible"
        resp4 = TEMPLATES[3]["response_template"].format(
            urban_desc=urban_desc,
            urban_sig=urban_sig
        )
        data.append({
            "id": f"sq-inst-{len(data)+1:05d}",
            "instruction": TEMPLATES[3]["instruction"],
            "input": f"Classes: {classes_str}.",
            "output": resp4
        })

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

    print(f"Successfully generated {len(data)} instruction pairs at: {output_path}")
    return output_path


if __name__ == "__main__":
    generate_dataset()
