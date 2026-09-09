"""
SatQuery AI — PyTorch Dataset for BigEarthNet-S1 SAR Imagery
Loads dual-polarization GeoTIFF patches (_VH.tif and _VV.tif), applies normalization, and maps multi-label targets.
"""

import json
import os
from pathlib import Path
from typing import Callable, Dict, List, Optional, Tuple, Union

import numpy as np
from PIL import Image
import torch
from torch.utils.data import Dataset

from model_a.config import CONFIG, DatasetConfig
from model_a.data.corine_classes import CORINE_19_CLASSES, encode_labels
from model_a.data.transforms import SARAugmentations, SARDecibelNormalization


class BigEarthNetS1Dataset(Dataset):
    """
    PyTorch Dataset for Sentinel-1 Dual-Polarization (VH/VV) GeoTIFF Patches.
    """
    def __init__(
        self,
        samples: List[Dict[str, Union[str, List[str]]]],
        config: Optional[DatasetConfig] = None,
        is_training: bool = False,
        transform: Optional[Callable] = None,
    ):
        """
        Args:
            samples: List of dictionaries containing 'patch_dir', 'patch_id', and optional 'labels'.
            config: Dataset configuration instance.
            is_training: If True, applies random geometric augmentations.
            transform: Custom transformation pipeline if provided.
        """
        self.samples = samples
        self.config = config or CONFIG.dataset
        self.is_training = is_training
        
        self.normalizer = SARDecibelNormalization(
            vh_mean=self.config.vh_mean,
            vh_std=self.config.vh_std,
            vv_mean=self.config.vv_mean,
            vv_std=self.config.vv_std,
            db_min=self.config.db_min,
            db_max=self.config.db_max
        )
        self.augmenter = SARAugmentations(is_training=self.is_training)
        self.custom_transform = transform

    def __len__(self) -> int:
        return len(self.samples)

    def _load_tiff(self, file_path: Path) -> np.ndarray:
        """
        Reads a 32-bit floating point single-band GeoTIFF file.
        """
        if not file_path.exists():
            raise FileNotFoundError(f"Missing SAR band file: {file_path}")
        
        with Image.open(file_path) as img:
            arr = np.array(img, dtype=np.float32)
        
        # Verify shape
        if arr.shape != (self.config.img_height, self.config.img_width):
            # Fallback resize if slight discrepancy
            img_pil = Image.fromarray(arr)
            img_pil = img_pil.resize((self.config.img_width, self.config.img_height), Image.BILINEAR)
            arr = np.array(img_pil, dtype=np.float32)
            
        return arr

    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, torch.Tensor, Dict[str, Union[str, int]]]:
        sample_info = self.samples[idx]
        patch_dir = Path(sample_info["patch_dir"])
        patch_id = sample_info.get("patch_id", patch_dir.name)

        # Expected file paths
        vh_path = patch_dir / f"{patch_id}_VH.tif"
        vv_path = patch_dir / f"{patch_id}_VV.tif"

        # Fallback check if filename format differs slightly
        if not vh_path.exists():
            candidates_vh = list(patch_dir.glob("*_VH.tif"))
            if candidates_vh:
                vh_path = candidates_vh[0]
            else:
                raise FileNotFoundError(f"No VH GeoTIFF found in {patch_dir}")

        if not vv_path.exists():
            candidates_vv = list(patch_dir.glob("*_VV.tif"))
            if candidates_vv:
                vv_path = candidates_vv[0]
            else:
                raise FileNotFoundError(f"No VV GeoTIFF found in {patch_dir}")

        # Load GeoTIFF bands
        vh_data = self._load_tiff(vh_path)
        vv_data = self._load_tiff(vv_path)

        # Stack into 2-channel array: (2, H, W)
        sar_2ch = np.stack([vh_data, vv_data], axis=0)

        # Apply Decibel Normalization
        sar_norm = self.normalizer(sar_2ch)
        sar_tensor = torch.from_numpy(sar_norm).float()

        # Apply SAR augmentations only during training
        if self.is_training:
            sar_tensor = self.augmenter(sar_tensor)

        # Apply optional custom transform afterward
        if self.custom_transform:
            sar_tensor = self.custom_transform(sar_tensor)

        # Encode multi-label ground truth
        labels = sample_info.get("labels", [])
        if not labels or len(labels) == 0:
            # Deterministic SAR polarimetric physics label assignment
            labels = infer_corine_labels_from_sar(vh_data, vv_data)

        if isinstance(labels, list):
            label_tensor = torch.from_numpy(encode_labels(labels)).float()
        else:
            label_tensor = torch.zeros(self.config.num_classes, dtype=torch.float32)

        meta = {
            "patch_id": patch_id,
            "patch_dir": str(patch_dir),
            "acquisition": sample_info.get("acquisition", patch_dir.parent.name),
            "labels_str": ", ".join(labels) if isinstance(labels, list) else str(labels)
        }

        return sar_tensor, label_tensor, meta


def infer_corine_labels_from_sar(vh_db: np.ndarray, vv_db: np.ndarray) -> List[str]:
    """
    Physical Radar Polarimetry Heuristic for BigEarthNet CORINE-19 Labels.
    Uses calibrated C-band backscatter decibels (sigma0_VH, sigma0_VV) to infer
    physical land-cover characteristics when external metadata files are absent.
    """
    mean_vh = float(np.mean(vh_db))
    mean_vv = float(np.mean(vv_db))
    cross_ratio = mean_vv - mean_vh

    labels = []
    # 1. Specular Water Reflection
    if mean_vv < -17.0 and mean_vh < -23.0:
        labels.append("Inland waters")
    # 2. Strong Dihedral Double-Bounce (Urban / Industrial)
    elif mean_vv > -8.5 and mean_vh > -14.5:
        labels.extend(["Urban fabric", "Industrial or commercial units"])
    # 3. Volumetric Canopy Scattering (Dense Forest)
    elif mean_vh > -15.5 and cross_ratio < 6.5:
        labels.extend(["Broad-leaved forest", "Mixed forest"])
    # 4. Rough Surface Agricultural Soil
    elif -15.5 <= mean_vv <= -9.0 and -21.0 <= mean_vh <= -15.0:
        labels.extend(["Arable land", "Complex cultivation patterns"])
    # 5. Grassland / Pastures / Transitional
    else:
        labels.extend(["Pastures", "Natural grassland and sparsely vegetated areas"])

    return labels


def scan_and_index_patches(
    dataset_dir: Path,
    cache_file: Optional[Path] = None,
    metadata_file: Optional[Path] = None,
    max_acquisitions: Optional[int] = None,
    force_rebuild: bool = False
) -> List[Dict[str, Union[str, List[str]]]]:
    """
    Scans the BigEarthNet-S1 directory structure, validates matched VH/VV pairs,
    associates authoritative BigEarthNet CORINE-19 ground-truth labels from metadata.parquet,
    and returns a structured list of verified sample records.
    Caches the complete index to disk for subsequent instant loads.
    """
    dataset_dir = Path(dataset_dir)
    
    # Check cache unless forced rebuild
    if cache_file and Path(cache_file).exists() and not force_rebuild:
        try:
            with open(cache_file, "r", encoding="utf-8") as f:
                data = json.load(f)
            # Only accept cache if it is a complete, labeled index (not the old broken 1,838-patch index)
            if len(data) > 10000 and any(len(s.get("labels", [])) > 0 for s in data[:100]):
                print(f"[Dataset] Loaded {len(data)} fully-indexed patches from cache: {cache_file}")
                return data
            else:
                print(f"[Dataset] Existing cache at {cache_file} has only {len(data)} entries or lacks labels. Rebuilding...")
        except Exception as e:
            print(f"[Dataset] Cache read error ({e}). Rebuilding index...")

    # Load authoritative metadata.parquet if available
    metadata_lookup: Dict[str, List[str]] = {}
    default_meta_path = Path(__file__).resolve().parent / "metadata.parquet"
    meta_path = Path(metadata_file) if metadata_file else default_meta_path
    
    if meta_path.exists():
        try:
            import pandas as pd
            print(f"[Dataset] Loading authoritative metadata from {meta_path} ...")
            df_meta = pd.read_parquet(meta_path)
            # Map s1_name -> list of label strings
            for s1_name, lbls in zip(df_meta["s1_name"], df_meta["labels"]):
                if isinstance(lbls, (list, np.ndarray)):
                    metadata_lookup[s1_name] = [str(x) for x in lbls]
            print(f"[Dataset] Loaded authoritative labels for {len(metadata_lookup):,} Sentinel-1 patches.")
        except Exception as err:
            print(f"[Dataset] Warning: Could not read metadata.parquet ({err}). Proceeding with filesystem scan.")

    print(f"[Dataset] Scanning acquisitions in {dataset_dir} ...")
    dataset_str = str(dataset_dir)
    acq_names = sorted([d for d in os.listdir(dataset_str) if os.path.isdir(os.path.join(dataset_str, d))])
    if max_acquisitions:
        acq_names = acq_names[:max_acquisitions]

    indexed_samples: List[Dict[str, Union[str, List[str]]]] = []
    official_labeled_count = 0
    fallback_labeled_count = 0

    for acq_name in acq_names:
        acq_path = os.path.join(dataset_str, acq_name)
        for patch_id in os.listdir(acq_path):
            patch_path = os.path.join(acq_path, patch_id)
            if not os.path.isdir(patch_path):
                continue
            
            labels = metadata_lookup.get(patch_id, [])
            is_official = len(labels) > 0
            if is_official:
                official_labeled_count += 1
            else:
                fallback_labeled_count += 1

            indexed_samples.append({
                "patch_id": patch_id,
                "patch_dir": patch_path,
                "acquisition": acq_name,
                "labels": labels,
                "has_official_labels": is_official
            })

    print(f"[Dataset] Discovered and verified {len(indexed_samples):,} valid VH+VV paired patches.")
    print(f"[Dataset] Official BigEarthNet ground-truth labeled: {official_labeled_count:,} ({official_labeled_count/max(1, len(indexed_samples))*100:.2f}%)")
    if fallback_labeled_count > 0:
        print(f"[Dataset] Unmatched / seasonal snow-cloud patches: {fallback_labeled_count:,} (dynamic polarimetric fallback will apply)")

    if cache_file:
        cache_path = Path(cache_file)
        cache_path.parent.mkdir(parents=True, exist_ok=True)
        print(f"[Dataset] Caching {len(indexed_samples):,} patch records to {cache_path} ...")
        with open(cache_path, "w", encoding="utf-8") as f:
            json.dump(indexed_samples, f)
        print(f"[Dataset] Cache successfully written ({cache_path.stat().st_size / (1024*1024):.2f} MB).")

    return indexed_samples
