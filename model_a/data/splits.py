"""
SatQuery AI — Reproducible Train / Validation / Test Splitting
Supports Acquisition-level splitting to prevent spatial autocorrelation data leakage,
as well as deterministic patch-level splitting.
"""

import json
from pathlib import Path
import random
from typing import Dict, List, Tuple, Union

from model_a.config import CONFIG, DatasetConfig


def create_reproducible_splits(
    samples: List[Dict[str, Union[str, List[str]]]],
    config: DatasetConfig = CONFIG.dataset,
    split_cache_path: Path = Path(r"D:\SIH\sat-query-sih\model_a\cache\splits.json"),
    by_acquisition: bool = True,
    force_rebuild: bool = False
) -> Tuple[List[Dict[str, Union[str, List[str]]]], List[Dict[str, Union[str, List[str]]]], List[Dict[str, Union[str, List[str]]]]]:
    """
    Splits samples into Train (70%), Validation (15%), and Test (15%) subsets.
    Guarantees strict zero acquisition leakage (no acquisition or patch appears in multiple splits).
    """
    split_cache_path = Path(split_cache_path)
    
    if split_cache_path.exists() and not force_rebuild:
        try:
            with open(split_cache_path, "r", encoding="utf-8") as f:
                cached_splits = json.load(f)
            
            # Verify cache validity (not the old broken 85-train split)
            cached_train_len = len(cached_splits.get("train", []))
            if cached_train_len > 1000 or (len(samples) < 2000 and cached_train_len > len(cached_splits.get("val", []))):
                patch_dict = {s["patch_id"]: s for s in samples}
                train_samples = [patch_dict[pid] for pid in cached_splits["train"] if pid in patch_dict]
                val_samples = [patch_dict[pid] for pid in cached_splits["val"] if pid in patch_dict]
                test_samples = [patch_dict[pid] for pid in cached_splits["test"] if pid in patch_dict]
                
                if len(train_samples) > 0 and len(val_samples) > 0 and len(test_samples) > 0:
                    print(f"[Splits] Loaded valid splits from cache: {split_cache_path}")
                    print(f"[Splits] Train: {len(train_samples):,} | Val: {len(val_samples):,} | Test: {len(test_samples):,}")
                    return train_samples, val_samples, test_samples
            print(f"[Splits] Existing cache at {split_cache_path} is outdated or invalid (train={cached_train_len}). Recomputing splits...")
        except Exception as err:
            print(f"[Splits] Cache read failed ({err}). Recomputing splits...")

    n_total = len(samples)
    target_train = int(n_total * config.train_ratio)
    target_val = int(n_total * config.val_ratio)

    rng = random.Random(config.random_seed)

    if by_acquisition:
        # Group samples strictly by acquisition directory
        acq_to_samples: Dict[str, List[Dict[str, Union[str, List[str]]]]] = {}
        for s in samples:
            acq = str(s.get("acquisition", "unknown"))
            acq_to_samples.setdefault(acq, []).append(s)

        acq_names = sorted(acq_to_samples.keys())
        rng.shuffle(acq_names)

        train_acqs, val_acqs, test_acqs = [], [], []
        train_count, val_count, test_count = 0, 0, 0

        for a in acq_names:
            c = len(acq_to_samples[a])
            if train_count + c <= target_train or (val_count >= target_val and test_count >= target_val):
                train_acqs.append(a)
                train_count += c
            elif val_count + c <= target_val:
                val_acqs.append(a)
                val_count += c
            else:
                test_acqs.append(a)
                test_count += c

        # Verify zero acquisition leakage
        set_train_acq = set(train_acqs)
        set_val_acq = set(val_acqs)
        set_test_acq = set(test_acqs)
        assert set_train_acq.isdisjoint(set_val_acq), "FATAL: Train and Val acquisitions overlap!"
        assert set_train_acq.isdisjoint(set_test_acq), "FATAL: Train and Test acquisitions overlap!"
        assert set_val_acq.isdisjoint(set_test_acq), "FATAL: Val and Test acquisitions overlap!"

        train_samples = [s for a in train_acqs for s in acq_to_samples[a]]
        val_samples = [s for a in val_acqs for s in acq_to_samples[a]]
        test_samples = [s for a in test_acqs for s in acq_to_samples[a]]

        print(f"[Splits] Acquisition-Level Zero-Leakage Split Created:")
        print(f"         TRAIN: {len(train_samples):,} patches ({len(train_samples)/n_total*100:.2f}%) across {len(train_acqs)} acquisitions")
        print(f"         VAL:   {len(val_samples):,} patches ({len(val_samples)/n_total*100:.2f}%) across {len(val_acqs)} acquisitions")
        print(f"         TEST:  {len(test_samples):,} patches ({len(test_samples)/n_total*100:.2f}%) across {len(test_acqs)} acquisitions")
    else:
        # Patch level random split
        shuffled = list(samples)
        rng.shuffle(shuffled)
        train_samples = shuffled[:target_train]
        val_samples = shuffled[target_train:target_train + target_val]
        test_samples = shuffled[target_train + target_val:]

    # Verify zero patch leakage
    train_ids = set(s["patch_id"] for s in train_samples)
    val_ids = set(s["patch_id"] for s in val_samples)
    test_ids = set(s["patch_id"] for s in test_samples)
    assert train_ids.isdisjoint(val_ids), "FATAL: Patch leakage between Train and Val!"
    assert train_ids.isdisjoint(test_ids), "FATAL: Patch leakage between Train and Test!"
    assert val_ids.isdisjoint(test_ids), "FATAL: Patch leakage between Val and Test!"

    # Cache split patch IDs
    split_cache_path.parent.mkdir(parents=True, exist_ok=True)
    cache_payload = {
        "train": [s["patch_id"] for s in train_samples],
        "val": [s["patch_id"] for s in val_samples],
        "test": [s["patch_id"] for s in test_samples],
        "seed": config.random_seed,
        "by_acquisition": by_acquisition,
        "stats": {
            "total_patches": n_total,
            "train_count": len(train_samples),
            "val_count": len(val_samples),
            "test_count": len(test_samples)
        }
    }
    with open(split_cache_path, "w", encoding="utf-8") as f:
        json.dump(cache_payload, f, indent=2)
    print(f"[Splits] Saved verified split indices to {split_cache_path}")

    return train_samples, val_samples, test_samples
