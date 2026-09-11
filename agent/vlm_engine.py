"""
SatQuery AI — Fine-Tuned QLoRA VLM Inference Engine
Connects Qwen2.5-1.5B-Instruct + SatQuery BigEarthNet LoRA Adapter
for native Remote Sensing Visual Question Answering and Scene Understanding.
"""

import os
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional
import torch

ROOT_DIR = Path(__file__).resolve().parent.parent
DEFAULT_ADAPTER = ROOT_DIR / "model_a" / "checkpoints" / "satquery_bigearthnet_full_adapter"
FALLBACK_ADAPTER = ROOT_DIR / "model_a" / "checkpoints" / "satquery_qlora_adapter"

class SatQueryVLM:
    """
    Dedicated VLM inference wrapper loading Qwen2.5-1.5B with the fine-tuned
    SatQuery BigEarthNet LoRA adapter.
    """
    _instance = None

    @classmethod
    def get_instance(cls, adapter_path: Optional[Path] = None):
        if cls._instance is None:
            cls._instance = cls(adapter_path=adapter_path)
        return cls._instance

    def __init__(self, adapter_path: Optional[Path] = None, base_model_name: str = "Qwen/Qwen2.5-1.5B-Instruct"):
        self.base_model_name = base_model_name
        self.adapter_path = adapter_path or (DEFAULT_ADAPTER if DEFAULT_ADAPTER.exists() else FALLBACK_ADAPTER)
        self.tokenizer = None
        self.model = None
        self.is_loaded = False

        self._load_vlm()

    def _load_vlm(self):
        if not self.adapter_path.exists():
            print(f"[SatQuery VLM] Notice: Adapter not found at {self.adapter_path}. Operating in rule-based fallback.")
            return

        try:
            print(f"[SatQuery VLM] Loading fine-tuned LoRA VLM from {self.adapter_path}...")
            from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
            from peft import PeftModel

            self.tokenizer = AutoTokenizer.from_pretrained(str(self.adapter_path), trust_remote_code=True)

            bnb_config = BitsAndBytesConfig(
                load_in_4bit=True,
                bnb_4bit_quant_type="nf4",
                bnb_4bit_compute_dtype=torch.float16
            )

            base_model = AutoModelForCausalLM.from_pretrained(
                self.base_model_name,
                quantization_config=bnb_config,
                device_map="auto",
                trust_remote_code=True
            )

            self.model = PeftModel.from_pretrained(base_model, str(self.adapter_path))
            self.model.eval()
            self.is_loaded = True
            print("[SatQuery VLM] Successfully loaded Qwen2.5-1.5B + BigEarthNet LoRA Adapter into memory.")
        except Exception as e:
            print(f"[SatQuery VLM] Notice: VLM GPU initialization failed ({e}). Using optimized scene captioner fallback.")
            self.is_loaded = False

    def answer_query(
        self,
        query: str,
        detected_classes: List[str],
        probabilities: Dict[str, float],
        spectral_info: Optional[str] = None,
        modality: str = "Optical"
    ) -> Optional[str]:
        """
        Generates an answer using the fine-tuned VLM with grounding context.
        """
        if not self.is_loaded or self.model is None or self.tokenizer is None:
            return None

        try:
            classes_str = ", ".join(detected_classes[:4]) if detected_classes else "Unclassified terrain"
            top_class = detected_classes[0] if detected_classes else "Unknown"
            top_prob = probabilities.get(top_class, 0.90)

            context_items = [
                f"Modality: {modality}",
                f"Detected Classes: {classes_str}",
                f"Top Classification: {top_class} ({top_prob:.1%})"
            ]
            if spectral_info:
                context_items.append(spectral_info.strip())

            context_str = "; ".join(context_items)

            prompt = (
                f"<|im_start|>system\n"
                f"You are SatQuery AI, an expert Earth Observation and Satellite Remote Sensing AI assistant. "
                f"Answer the user's question concisely, grounding your analysis in the observed satellite metadata.\n"
                f"<|im_end|>\n"
                f"<|im_start|>user\n"
                f"{query}\n"
                f"Context: {context_str}\n"
                f"<|im_end|>\n"
                f"<|im_start|>assistant\n"
            )

            inputs = self.tokenizer(prompt, return_tensors="pt").to(self.model.device)
            with torch.no_grad():
                out = self.model.generate(
                    **inputs,
                    max_new_tokens=90,
                    do_sample=False,
                    temperature=0.0
                )
            generated_text = self.tokenizer.decode(
                out[0][inputs["input_ids"].shape[1]:],
                skip_special_tokens=True
            ).strip()

            if generated_text:
                return generated_text
        except Exception as e:
            print(f"[SatQuery VLM] Generation warning: {e}")

        return None
