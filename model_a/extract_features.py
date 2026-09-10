"""
SatQuery AI — Phase 4: Standalone SAR Feature Extraction CLI Tool
Extracts 512-dimensional semantic feature vectors from Sentinel-1 SAR imagery,
performs pairwise similarity comparisons, and saves embeddings for downstream systems.
"""

import argparse
import json
from pathlib import Path
import sys
import time

import numpy as np

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from model_a.encoder import SAREncoder


def main():
    parser = argparse.ArgumentParser(description="SatQuery AI — SAR Feature Extraction Engine (Phase 4)")
    parser.add_argument("--vh", type=str, help="Path to Sentinel-1 VH GeoTIFF")
    parser.add_argument("--vv", type=str, help="Path to Sentinel-1 VV GeoTIFF")
    parser.add_argument("--compare-vh", type=str, help="Path to second VH GeoTIFF for temporal/spatial comparison")
    parser.add_argument("--compare-vv", type=str, help="Path to second VV GeoTIFF for temporal/spatial comparison")
    parser.add_argument("--out", type=str, help="Optional output path to save embedding vector (.npy or .json)")
    parser.add_argument("--checkpoint", type=str, default=None, help="Path to Model A checkpoint (.pt)")

    args = parser.parse_args()

    print("=" * 70)
    print("SATQUERY AI — PHASE 4: SAR FEATURE ENCODER")
    print("=" * 70)

    # Initialize Encoder
    t0 = time.time()
    encoder = SAREncoder(checkpoint_path=args.checkpoint)
    init_time = (time.time() - t0) * 1000.0
    print(f"[Encoder] Initialized on {encoder.device} in {init_time:.1f} ms")

    # If default sample is requested without args
    if not args.vh or not args.vv:
        sample_dir = Path(r"D:\SIH\BigEarthNet-S1\S1A_IW_GRDH_1SDV_20170613T165043\S1A_IW_GRDH_1SDV_20170613T165043_33UUP_61_39")
        vh_path = sample_dir / "S1A_IW_GRDH_1SDV_20170613T165043_33UUP_61_39_VH.tif"
        vv_path = sample_dir / "S1A_IW_GRDH_1SDV_20170613T165043_33UUP_61_39_VV.tif"
        print(f"\n[Info] No files specified. Running demonstration on real sample:\n       {vh_path.name}")
    else:
        vh_path = Path(args.vh)
        vv_path = Path(args.vv)

    # 1. Feature Extraction
    t0 = time.time()
    embedding = encoder.encode_sar(vh_path, vv_path, normalize_embedding=True)
    extract_time = (time.time() - t0) * 1000.0

    print(f"\n[Result] Extracted Embedding:")
    print(f"         Dimensions:       {embedding.shape[0]}")
    print(f"         L2-Norm:          {np.linalg.norm(embedding):.4f}")
    print(f"         Embedding Range:  [{embedding.min():.4f}, {embedding.max():.4f}]")
    print(f"         Extraction Time:  {extract_time:.2f} ms")
    print(f"         Sample Values:    {np.round(embedding[:8], 4).tolist()} ...")

    # 2. Pairwise Comparison (if second patch provided or demo mode)
    if args.compare_vh and args.compare_vv:
        comp_vh = Path(args.compare_vh)
        comp_vv = Path(args.compare_vv)
    elif not args.vh:
        comp_dir = Path(r"D:\SIH\BigEarthNet-S1\S1A_IW_GRDH_1SDV_20170613T165043\S1A_IW_GRDH_1SDV_20170613T165043_33UUP_61_40")
        comp_vh = comp_dir / "S1A_IW_GRDH_1SDV_20170613T165043_33UUP_61_40_VH.tif"
        comp_vv = comp_dir / "S1A_IW_GRDH_1SDV_20170613T165043_33UUP_61_40_VV.tif"
    else:
        comp_vh = None
        comp_vv = None

    if comp_vh and comp_vv and comp_vh.exists() and comp_vv.exists():
        comp_embedding = encoder.encode_sar(comp_vh, comp_vv, normalize_embedding=True)
        similarity = encoder.compute_similarity(embedding, comp_embedding)
        print(f"\n[Comparison] Comparing with: {comp_vh.name}")
        print(f"             Cosine Similarity: {similarity:.4f} ({similarity * 100.0:.1f}%)")

    # 3. Save Output
    if args.out:
        out_path = Path(args.out)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        if out_path.suffix == ".json":
            with open(out_path, "w") as f:
                json.dump({"patch": vh_path.stem.replace("_VH", ""), "embedding": embedding.tolist()}, f)
        else:
            np.save(out_path, embedding)
        print(f"\n[Save] Saved embedding to {out_path}")

    print("=" * 70)


if __name__ == "__main__":
    main()
