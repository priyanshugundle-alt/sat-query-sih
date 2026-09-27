"""
SatQuery AI — Pre-Trained Qwen2.5-1.5B-Instruct VLM Engine
Uses the base pre-trained model WITHOUT any LoRA adapter.
Model is downloaded from HuggingFace on first run (~3GB).
After first download, runs fully offline from local cache.
"""

import os
import sys
from pathlib import Path
from typing import Dict, List, Optional
import torch

ROOT_DIR = Path(__file__).resolve().parent.parent

PROJECT_ROOT = Path(__file__).resolve().parent.parent

# Check for local fine-tuned merged model (fused 10-chunk weights)
MERGED_MODEL_PATH = None
for candidate in [
    PROJECT_ROOT / "model_server" / "model_weights" / "merged_model",
    Path("D:/Team Elite/satquery_trainer/output/merged_model"),
    PROJECT_ROOT / "Team Elite" / "satquery_trainer" / "output" / "merged_model",
    PROJECT_ROOT.parent / "Team Elite" / "satquery_trainer" / "output" / "merged_model",
    PROJECT_ROOT / "satquery_trainer" / "output" / "merged_model",
    PROJECT_ROOT / "output" / "merged_model",
]:
    if candidate.exists() and (candidate / "config.json").exists():
        MERGED_MODEL_PATH = candidate
        break

# Base model fallback
VLM_MODEL_ID = str(MERGED_MODEL_PATH) if MERGED_MODEL_PATH else os.environ.get("SATQUERY_VLM_MODEL", "Qwen/Qwen2.5-1.5B-Instruct")

# Use local cache if already downloaded, else download
HF_CACHE_DIR = os.environ.get(
    "HF_HOME",
    str(Path.home() / ".cache" / "huggingface")
)

# Check if model already cached locally
def _model_is_cached(model_id: str) -> bool:
    p = Path(model_id)
    if p.exists():
        return True
    cache_path = Path(HF_CACHE_DIR) / "hub" / f"models--{model_id.replace('/', '--')}"
    return cache_path.exists() and any(cache_path.iterdir())


class SatQueryVLM:
    """
    VLM inference engine supporting local fine-tuned merged weights and pre-trained backbones.
    """
    _instance = None

    @classmethod
    def get_instance(cls, model_id: Optional[str] = None):
        if cls._instance is None:
            cls._instance = cls(model_id=model_id)
        return cls._instance

    def __init__(self, model_id: Optional[str] = None):
        self.model_id = model_id or VLM_MODEL_ID
        self.processor = None
        self.tokenizer = None
        self.model = None
        self.is_loaded = False
        self._load_vlm()

    def _load_vlm(self):
        cached = _model_is_cached(self.model_id)
        if not cached:
            print(f"[SatQuery VLM] Model {self.model_id} not in local cache.")
            print(f"[SatQuery VLM] Will attempt download from HuggingFace (~3GB)...")
            print(f"[SatQuery VLM] If download fails (no internet), VLM will be disabled.")
            print(f"[SatQuery VLM] Specialist rule-based engine will handle responses.")

        try:
            import json
            is_vl = False
            config_file = Path(self.model_id) / "config.json"
            if config_file.exists():
                try:
                    with open(config_file, "r") as cf:
                        cfg = json.load(cf)
                        if cfg.get("model_type") == "qwen2_5_vl" or any("VL" in str(a) for a in cfg.get("architectures", [])):
                            is_vl = True
                except Exception:
                    pass

            if MERGED_MODEL_PATH and str(MERGED_MODEL_PATH) == self.model_id:
                print(f"[SatQuery VLM] Loading fine-tuned Team Elite merged model from: {self.model_id}")
            else:
                print(f"[SatQuery VLM] Loading {self.model_id}...")

            device = "cuda" if torch.cuda.is_available() else "cpu"
            dtype = torch.bfloat16 if torch.cuda.is_available() else torch.float32

            if is_vl:
                from transformers import AutoProcessor
                try:
                    from transformers import Qwen2_5_VLForConditionalGeneration
                    ModelClass = Qwen2_5_VLForConditionalGeneration
                except ImportError:
                    from transformers import AutoModelForImageTextToText
                    ModelClass = AutoModelForImageTextToText

                self.processor = AutoProcessor.from_pretrained(
                    self.model_id,
                    trust_remote_code=True,
                    cache_dir=HF_CACHE_DIR if not Path(self.model_id).exists() else None,
                )
                self.tokenizer = getattr(self.processor, "tokenizer", None)
                self.model = ModelClass.from_pretrained(
                    self.model_id,
                    torch_dtype=dtype,
                    device_map="auto" if torch.cuda.is_available() else {"": "cpu"},
                    trust_remote_code=True,
                    cache_dir=HF_CACHE_DIR if not Path(self.model_id).exists() else None,
                    low_cpu_mem_usage=True,
                )
            else:
                from transformers import AutoModelForCausalLM, AutoTokenizer
                self.tokenizer = AutoTokenizer.from_pretrained(
                    self.model_id,
                    trust_remote_code=True,
                    cache_dir=HF_CACHE_DIR if not Path(self.model_id).exists() else None,
                )
                self.model = AutoModelForCausalLM.from_pretrained(
                    self.model_id,
                    torch_dtype=dtype,
                    device_map="auto" if torch.cuda.is_available() else {"": "cpu"},
                    trust_remote_code=True,
                    cache_dir=HF_CACHE_DIR if not Path(self.model_id).exists() else None,
                    low_cpu_mem_usage=True,
                )

            self.model.eval()
            self.is_loaded = True
            print(f"[SatQuery VLM] [OK] {self.model_id} loaded successfully (Vision-Language: {is_vl}).")

        except Exception as e:
            err_str = str(e)
            if "getaddrinfo" in err_str or "connection" in err_str.lower() or "network" in err_str.lower():
                print(f"[SatQuery VLM] Network unavailable — cannot download model.")
            else:
                print(f"[SatQuery VLM] Load notice: {e}")
            print("[SatQuery VLM] Using specialist rule-based engine for responses.")
            self.is_loaded = False

    def answer_query(
        self,
        query: str,
        detected_classes: List[str],
        probabilities: Dict[str, float],
        spectral_info: Optional[str] = None,
        modality: str = "Optical",
        image_path: Optional[str] = None,   # accepted but not used in text-only mode
    ) -> Optional[str]:
        """
        Generates an answer using Qwen2.5-1.5B-Instruct with satellite context.
        """
        if not self.is_loaded or self.model is None or self.tokenizer is None:
            return None

        try:
            classes_str = ", ".join(detected_classes[:5]) if detected_classes else "Unclassified terrain"
            top_class   = detected_classes[0] if detected_classes else "Unknown"
            top_prob    = probabilities.get(top_class, 0.90)

            context_parts = [
                f"Sensor: {modality} satellite",
                f"Detected land cover: {classes_str}",
                f"Dominant class: {top_class} ({top_prob:.0%} confidence)",
            ]
            if spectral_info:
                context_parts.append(spectral_info.strip())
            context_str = ". ".join(context_parts)

            messages = [
                {
                    "role": "system",
                    "content": (
                        "You are SatQuery AI, an expert Senior Earth Observation Scientist. "
                        "Provide a direct, authoritative, and scientifically detailed technical assessment (2-3 concise paragraphs) "
                        "analyzing the satellite scene, identified land cover categories, spectral signatures, and geospatial implications."
                    )
                },
                {
                    "role": "user",
                    "content": (
                        f"Satellite Telemetry:\n{context_str}\n\n"
                        f"Query: {query}\n\n"
                        "Provide your technical remote sensing analysis:"
                    )
                }
            ]

            # Multi-threaded CPU acceleration
            try:
                import multiprocessing
                torch.set_num_threads(multiprocessing.cpu_count())
            except Exception:
                pass

            # Apply Qwen chat template
            text = self.tokenizer.apply_chat_template(
                messages,
                tokenize=False,
                add_generation_prompt=True,
            )

            inputs = self.tokenizer([text], return_tensors="pt")

            with torch.inference_mode():
                out_ids = self.model.generate(
                    **inputs,
                    max_new_tokens=75,
                    do_sample=False,
                    temperature=None,
                    top_p=None,
                    repetition_penalty=1.1,
                )

            # Strip input tokens — only keep generated part
            new_tokens = out_ids[0][len(inputs.input_ids[0]):]
            answer = self.tokenizer.decode(new_tokens, skip_special_tokens=True).strip()

            if answer:
                print(f"[SatQuery VLM] Generated answer ({len(answer)} chars)")
                return answer

        except Exception as e:
            print(f"[SatQuery VLM] Generation warning: {e}")

        return None
