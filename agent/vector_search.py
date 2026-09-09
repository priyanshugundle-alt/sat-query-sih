"""
SatQuery AI — Dense Vector Retrieval Index & Semantic Geo-Search (Phase 9)
Indexes 512-dimensional normalized feature embeddings from Sentinel-1 SAR imagery
to enable sub-millisecond nearest-neighbor search across satellite catalogs.
"""

from pathlib import Path
import time
from typing import Any, Dict, List, Optional, Tuple, Union

import numpy as np
import torch

from model_a.config import CONFIG as MODEL_A_CONFIG
from model_a.encoder import SAREncoder


class VectorSearchEngine:
    """
    In-memory high-speed dense retrieval engine for Earth Observation rasters.
    Computes vectorized cosine similarities across 512-dim unit-normalized embeddings.
    """
    def __init__(
        self,
        encoder: Optional[SAREncoder] = None,
        cache_dir: Optional[Path] = None,
        checkpoint_path: Optional[Union[str, Path]] = None,
    ):
        self.encoder = encoder or SAREncoder(
            checkpoint_path=checkpoint_path or (MODEL_A_CONFIG.training.checkpoint_dir / "latest_checkpoint.pt")
        )
        self.cache_dir = cache_dir or MODEL_A_CONFIG.dataset.cache_dir
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        
        self.index_file = self.cache_dir / "vector_index_512.npz"
        self.meta_file = self.cache_dir / "vector_index_meta.json"

        self.patch_ids: List[str] = []
        self.embeddings: Optional[np.ndarray] = None  # Shape: (N, 512)
        self.metadata: Dict[str, Dict[str, Any]] = {}
        self.is_indexed: bool = False
        self.build_time_sec: float = 0.0

    def build_or_load_index(
        self,
        patches: List[Dict[str, Any]],
        max_patches: int = 250,
        force_rebuild: bool = False
    ) -> int:
        """
        Loads pre-computed vector index from disk if available, or indexes the given patches.
        """
        t0 = time.time()

        if not force_rebuild and self._try_load_cache():
            self.build_time_sec = round(time.time() - t0, 3)
            print(f"[VectorSearch] Loaded {len(self.patch_ids)} indexed vectors from cache in {self.build_time_sec}s.")
            return len(self.patch_ids)

        # Build index from scratch
        print(f"[VectorSearch] Building 512-dim vector index for up to {max_patches} patches...")
        indexed_ids = []
        indexed_vecs = []
        indexed_meta = {}

        count = 0
        for p in patches:
            if count >= max_patches:
                break
            
            patch_id = p.get("patch_id")
            vh_path = p.get("vh_path")
            vv_path = p.get("vv_path")

            if not patch_id:
                continue

            # Resolve paths if stored as strings
            vh_path = Path(vh_path) if vh_path else None
            vv_path = Path(vv_path) if vv_path else None

            # Check if files exist
            if not vh_path or not vv_path or not vh_path.exists() or not vv_path.exists():
                p_dir = Path(p.get("patch_dir", ""))
                if p_dir.exists():
                    vh_path = p_dir / f"{patch_id}_VH.tif"
                    vv_path = p_dir / f"{patch_id}_VV.tif"

            if not vh_path.exists() or not vv_path.exists():
                continue

            try:
                vec = self.encoder.encode_sar(vh_path, vv_path, normalize_embedding=True)
                indexed_ids.append(patch_id)
                indexed_vecs.append(vec.astype(np.float32))
                indexed_meta[patch_id] = {
                    "patch_id": patch_id,
                    "acquisition": p.get("acquisition", ""),
                    "labels": p.get("labels", []),
                    "vh_path": str(vh_path),
                    "vv_path": str(vv_path),
                }
                count += 1
            except Exception as e:
                continue

        if indexed_vecs:
            self.patch_ids = indexed_ids
            self.embeddings = np.stack(indexed_vecs, axis=0)  # (N, 512)
            self.metadata = indexed_meta
            self.is_indexed = True
            self.build_time_sec = round(time.time() - t0, 3)
            self._save_cache()
            print(f"[VectorSearch] Successfully indexed {len(self.patch_ids)} vectors in {self.build_time_sec}s.")
        else:
            print("[VectorSearch] Warning: No patches could be encoded.")

        return len(self.patch_ids)

    def _save_cache(self):
        """Saves matrix and metadata to disk for instant loading."""
        try:
            import json
            np.savez_compressed(self.index_file, patch_ids=np.array(self.patch_ids), embeddings=self.embeddings)
            with open(self.meta_file, "w", encoding="utf-8") as f:
                json.dump(self.metadata, f)
        except Exception as e:
            print(f"[VectorSearch] Warning: Could not save index cache: {e}")

    def _try_load_cache(self) -> bool:
        """Attempts to load precomputed vector matrix from disk."""
        if not self.index_file.exists() or not self.meta_file.exists():
            return False
        try:
            import json
            data = np.load(self.index_file, allow_pickle=True)
            self.patch_ids = list(data["patch_ids"])
            self.embeddings = data["embeddings"].astype(np.float32)
            with open(self.meta_file, "r", encoding="utf-8") as f:
                self.metadata = json.load(f)
            self.is_indexed = len(self.patch_ids) > 0
            return self.is_indexed
        except Exception as e:
            print(f"[VectorSearch] Cache load failed ({e}), rebuilding index...")
            return False

    def search_by_embedding(
        self,
        query_vector: np.ndarray,
        top_k: int = 6,
        exclude_patch_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Finds the top-K nearest patches using vectorized cosine similarity.
        """
        if not self.is_indexed or self.embeddings is None or len(self.patch_ids) == 0:
            return []

        # Ensure query is unit normalized
        q = query_vector.astype(np.float32).flatten()
        norm = np.linalg.norm(q)
        if norm > 1e-8:
            q = q / norm

        # Compute cosine similarities via dot product: (N, 512) @ (512,) -> (N,)
        sims = np.dot(self.embeddings, q)

        # Sort descending
        ranked_indices = np.argsort(sims)[::-1]

        results = []
        for idx in ranked_indices:
            pid = self.patch_ids[idx]
            if exclude_patch_id and pid == exclude_patch_id:
                continue

            sim_score = float(sims[idx])
            meta = self.metadata.get(pid, {})

            results.append({
                "patch_id": pid,
                "similarity": round(sim_score, 4),
                "similarity_pct": round(max(0.0, sim_score) * 100, 1),
                "acquisition": meta.get("acquisition", ""),
                "labels": meta.get("labels", []),
                "preview_url": f"/api/patches/{pid}/preview",
            })

            if len(results) >= top_k:
                break

        return results

    def search_by_patch(
        self,
        patch_id: str,
        top_k: int = 6,
        exclude_self: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Finds the top-K semantically similar patches for a given query patch.
        """
        if not self.is_indexed or self.embeddings is None:
            return []

        if patch_id in self.patch_ids:
            idx = self.patch_ids.index(patch_id)
            query_vec = self.embeddings[idx]
        else:
            # Not pre-indexed; encode dynamically
            meta = self.metadata.get(patch_id)
            if meta and "vh_path" in meta:
                query_vec = self.encoder.encode_sar(
                    Path(meta["vh_path"]),
                    Path(meta["vv_path"]),
                    normalize_embedding=True
                )
            else:
                return []

        exclude = patch_id if exclude_self else None
        return self.search_by_embedding(query_vec, top_k=top_k, exclude_patch_id=exclude)

    def search_by_classes(
        self,
        target_classes: List[str],
        top_k: int = 6
    ) -> List[Dict[str, Any]]:
        """
        Filters and ranks patches by target land-cover classes.
        """
        if not self.is_indexed:
            return []

        target_set = {c.strip().lower() for c in target_classes}
        scored_patches = []

        for pid in self.patch_ids:
            meta = self.metadata.get(pid, {})
            labels = meta.get("labels", [])
            labels_set = {l.strip().lower() for l in labels}

            overlap = target_set.intersection(labels_set)
            if overlap:
                score = len(overlap) / max(1, len(target_set))
                scored_patches.append({
                    "patch_id": pid,
                    "similarity": round(score, 4),
                    "similarity_pct": round(score * 100, 1),
                    "matched_classes": list(overlap),
                    "acquisition": meta.get("acquisition", ""),
                    "labels": labels,
                    "preview_url": f"/api/patches/{pid}/preview",
                })

        # Sort by overlap score descending
        scored_patches.sort(key=lambda x: x["similarity"], reverse=True)
        return scored_patches[:top_k]

    def get_stats(self) -> Dict[str, Any]:
        """Returns metadata about the active vector index."""
        return {
            "total_indexed_vectors": len(self.patch_ids),
            "embedding_dimension": 512,
            "device": str(self.encoder.device),
            "build_time_sec": self.build_time_sec,
            "cached_on_disk": self.index_file.exists(),
        }
