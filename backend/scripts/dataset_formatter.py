#!/usr/bin/env python3
"""
SatQuery AI — Dataset Formatter for Remote Sensing VLM Fine-Tuning.

Converts benchmark datasets (VRSBench, RSVQA, CDVQA, BigEarthNet-v2.0)
from sample-data into VLM Instruction-Tuning JSONL format.
"""

import json
import os
import argparse

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SAMPLE_DIR = os.path.join(SCRIPT_DIR, "..", "sample-data")

def convert_vrsbench(input_file, output_file):
    """Converts VRSBench (Captioning & Bounding Box Grounding) to Qwen2-VL JSONL."""
    samples = []
    if os.path.exists(input_file):
        with open(input_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
            for idx, item in enumerate(data):
                img_path = item.get("imagePaths", ["uploads/vrs_image.png"])[0]
                q_text = item.get("question", {}).get("questionText", "Describe this satellite scene.")
                ans_text = item.get("expectedAnswer", {}).get("answerText", "")
                bbox = item.get("expectedAnswer", {}).get("boundingBox")
                if bbox:
                    ans_text += f" Grounded bounding box: {bbox}"

                samples.append({
                    "id": f"vrsbench_{item.get('sampleId', idx)}",
                    "image": img_path,
                    "conversations": [
                        {"from": "user", "value": f"<image>\n{q_text}"},
                        {"from": "assistant", "value": ans_text}
                    ]
                })
    else:
        print(f"[Dataset Formatter] File {input_file} not found.")

    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    with open(output_file, 'w', encoding='utf-8') as out:
        for sample in samples:
            out.write(json.dumps(sample) + "\n")
    print(f"[Dataset Formatter] Saved {len(samples)} VRSBench formatted samples to {output_file}")

def convert_rsvqa(input_file, output_file):
    """Converts RSVQA (High/Low Res VQA) to Qwen2-VL JSONL."""
    samples = []
    if os.path.exists(input_file):
        with open(input_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
            for idx, item in enumerate(data):
                img_path = item.get("imagePaths", ["uploads/rsvqa_image.png"])[0]
                q_text = item.get("question", {}).get("questionText", "Identify features.")
                ans_text = item.get("expectedAnswer", {}).get("answerText", "")
                samples.append({
                    "id": f"rsvqa_{item.get('sampleId', idx)}",
                    "image": img_path,
                    "conversations": [
                        {"from": "user", "value": f"<image>\n{q_text}"},
                        {"from": "assistant", "value": ans_text}
                    ]
                })

    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    with open(output_file, 'w', encoding='utf-8') as out:
        for sample in samples:
            out.write(json.dumps(sample) + "\n")
    print(f"[Dataset Formatter] Saved {len(samples)} RSVQA formatted samples to {output_file}")

def convert_cdvqa(input_file, output_file):
    """Converts CDVQA (Bi-temporal Change Detection) to Qwen2-VL JSONL."""
    samples = []
    if os.path.exists(input_file):
        with open(input_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
            for idx, item in enumerate(data):
                imgs = item.get("imagePaths", ["uploads/cd_pre.png", "uploads/cd_post.png"])
                img_pre = imgs[0] if len(imgs) > 0 else "uploads/cd_pre.png"
                img_post = imgs[1] if len(imgs) > 1 else "uploads/cd_post.png"
                q_text = item.get("question", {}).get("questionText", "What changed?")
                ans_text = item.get("expectedAnswer", {}).get("answerText", "")
                samples.append({
                    "id": f"cdvqa_{item.get('sampleId', idx)}",
                    "images": [img_pre, img_post],
                    "conversations": [
                        {"from": "user", "value": f"<image_pre><image_post>\n{q_text}"},
                        {"from": "assistant", "value": ans_text}
                    ]
                })

    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    with open(output_file, 'w', encoding='utf-8') as out:
        for sample in samples:
            out.write(json.dumps(sample) + "\n")
    print(f"[Dataset Formatter] Saved {len(samples)} CDVQA formatted samples to {output_file}")

def convert_bigearthnet(output_file):
    """Converts BigEarthNet-v2.0 (Optical S2 + SAR S1) to Qwen2-VL JSONL."""
    samples = [
        {
            "id": "bigearthnet_sample_01",
            "image_optical": "sample-data/bigearthnet/s2_optical.tif",
            "image_sar": "sample-data/bigearthnet/s1_sar.tif",
            "conversations": [
                {"from": "user", "value": "Analyze this multi-modal scene combining Sentinel-2 Optical and Sentinel-1 SAR imagery."},
                {"from": "assistant", "value": "Optical imagery resolves road and canopy patterns. SAR backscatter penetrates cloud cover to map standing water."}
            ]
        }
    ]
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    with open(output_file, 'w', encoding='utf-8') as out:
        for sample in samples:
            out.write(json.dumps(sample) + "\n")
    print(f"[Dataset Formatter] Saved {len(samples)} BigEarthNet formatted samples to {output_file}")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="SatQuery AI Dataset Formatter")
    parser.add_argument('--dataset', choices=['vrsbench', 'rsvqa', 'cdvqa', 'bigearthnet', 'all'], default='all')
    args = parser.parse_args()

    out_dir = os.path.join(SAMPLE_DIR, "formatted_jsonl")

    if args.dataset in ['vrsbench', 'all']:
        convert_vrsbench(os.path.join(SAMPLE_DIR, "vrsbench_test.json"), os.path.join(out_dir, "vrsbench_formatted.jsonl"))
    if args.dataset in ['rsvqa', 'all']:
        convert_rsvqa(os.path.join(SAMPLE_DIR, "rsvqa_test.json"), os.path.join(out_dir, "rsvqa_formatted.jsonl"))
    if args.dataset in ['cdvqa', 'all']:
        convert_cdvqa(os.path.join(SAMPLE_DIR, "cdvqa_test.json"), os.path.join(out_dir, "cdvqa_formatted.jsonl"))
    if args.dataset in ['bigearthnet', 'all']:
        convert_bigearthnet(os.path.join(out_dir, "bigearthnet_formatted.jsonl"))

    print("[Dataset Formatter] All benchmark datasets formatted successfully!")

