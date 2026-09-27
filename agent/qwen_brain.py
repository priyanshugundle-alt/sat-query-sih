"""
SatQuery AI — Qwen-VL Super-Brain Interface
Loads Qwen2.5-VL-3B with 4-bit quantization and the fine-tuned S1/S2 QLoRA adapter.
Provides a unified prompting interface for Specialist Translators.
"""

import os
from pathlib import Path
from typing import List, Union

import torch
from transformers import AutoProcessor, Qwen2_5_VLForConditionalGeneration
from peft import PeftModel
from transformers import BitsAndBytesConfig

PROJECT_ROOT = Path(__file__).resolve().parent.parent

# Check for local fine-tuned merged model (fused 10-chunk weights)
MERGED_MODEL_PATH = None
for candidate in [
    PROJECT_ROOT / "model_server" / "model_weights" / "merged_model",
    PROJECT_ROOT / "Team Elite" / "satquery_trainer" / "output" / "merged_model",
    PROJECT_ROOT.parent / "Team Elite" / "satquery_trainer" / "output" / "merged_model",
    PROJECT_ROOT / "satquery_trainer" / "output" / "merged_model",
    PROJECT_ROOT / "output" / "merged_model",
]:
    if candidate.exists() and (candidate / "config.json").exists():
        MERGED_MODEL_PATH = candidate
        break

# Check for LoRA adapters
ADAPTER_PATH = None
for candidate in [
    PROJECT_ROOT / "Team Elite" / "satquery_trainer" / "output" / "chunk_10_adapter",
    PROJECT_ROOT / "Team Elite" / "satquery_trainer" / "output" / "lora_adapter",
    PROJECT_ROOT.parent / "Team Elite" / "satquery_trainer" / "output" / "chunk_10_adapter",
    PROJECT_ROOT / "satquery_qlora_adapter",
    PROJECT_ROOT / "model_a" / "checkpoints" / "satquery_qlora_adapter",
]:
    if candidate.exists() and (candidate / "adapter_config.json").exists():
        ADAPTER_PATH = candidate
        break


class QwenBrain:
    """Singleton class to load and prompt the fine-tuned Qwen-VL Super-Brain."""
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(QwenBrain, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self):
        print("[Qwen Brain] Initializing Qwen2.5-VL-3B-Instruct with fine-tuned weights...")
        
        has_cuda = torch.cuda.is_available()
        device_type = "GPU (CUDA)" if has_cuda else "CPU"
        print(f"[Qwen Brain] Device detected: {device_type}")

        model_kwargs = {
            "trust_remote_code": True,
            "low_cpu_mem_usage": True,
        }

        if has_cuda:
            quantization_config = BitsAndBytesConfig(
                load_in_4bit=True,
                bnb_4bit_compute_dtype=torch.float16,
                bnb_4bit_quant_type="nf4",
                bnb_4bit_use_double_quant=True,
            )
            model_kwargs["device_map"] = "auto"
            model_kwargs["quantization_config"] = quantization_config
            model_kwargs["torch_dtype"] = torch.float16
        else:
            model_kwargs["device_map"] = {"": "cpu"}
            model_kwargs["torch_dtype"] = torch.float32

        # 2. Prefer local merged 10-chunk fine-tuned model if available
        if MERGED_MODEL_PATH:
            self.model_id = str(MERGED_MODEL_PATH)
            print(f"[Qwen Brain] Loading local fine-tuned merged model from: {MERGED_MODEL_PATH}")
        else:
            self.model_id = "Qwen/Qwen2.5-VL-3B-Instruct"
            print(f"[Qwen Brain] Merged model not found locally; using base model ID: {self.model_id}")

        # 3. Load Model and Processor
        try:
            self.processor = AutoProcessor.from_pretrained(self.model_id, trust_remote_code=True)
            base_model = Qwen2_5_VLForConditionalGeneration.from_pretrained(
                self.model_id,
                **model_kwargs
            )

            # 4. Attach QLoRA Adapter if using base model and adapter is available
            if ADAPTER_PATH and not MERGED_MODEL_PATH:
                print(f"[Qwen Brain] Attaching QLoRA Adapter from {ADAPTER_PATH}...")
                self.model = PeftModel.from_pretrained(base_model, str(ADAPTER_PATH))
                self.is_loaded = True
                print("[Qwen Brain] QLoRA Adapter attached successfully. Ready for inference.")
            else:
                self.model = base_model
                self.is_loaded = True
                print("[Qwen Brain] Fine-tuned model loaded successfully. Ready for inference.")
                
        except Exception as e:
            print(f"[Qwen Brain] ERROR loading model: {e}")
            self.is_loaded = False
            self.model = None
            self.processor = None

    def ask_qwen(self, images: List[Union[str, bytes]], prompt: str) -> str:
        """
        Sends an image and a specific prompt to the fine-tuned Qwen Brain.
        images: List of local file paths (PNG/JPEG) or raw bytes.
        """
        if not getattr(self, "is_loaded", False) or getattr(self, "model", None) is None or getattr(self, "processor", None) is None:
            return "Error: Qwen-VL model is not loaded. Cannot process complex NLP query."

        try:
            from PIL import Image
            import io

            # Convert inputs to PIL Images
            pil_images = []
            for img in images:
                if isinstance(img, bytes):
                    pil_images.append(Image.open(io.BytesIO(img)).convert("RGB"))
                else:
                    pil_images.append(Image.open(img).convert("RGB"))

            # Format the multimodal conversation
            content = []
            for _ in pil_images:
                content.append({"type": "image"})
            content.append({"type": "text", "text": prompt})

            messages = [
                {
                    "role": "user",
                    "content": content,
                }
            ]

            # Prepare inputs
            text = self.processor.apply_chat_template(
                messages, tokenize=False, add_generation_prompt=True
            )
            image_inputs = pil_images if pil_images else None
            
            inputs = self.processor(
                text=[text],
                images=image_inputs,
                padding=True,
                return_tensors="pt",
            )
            inputs = inputs.to(self.model.device)

            # Generate Answer
            generated_ids = self.model.generate(**inputs, max_new_tokens=150)  # type: ignore
            generated_ids_trimmed = [
                out_ids[len(in_ids):] for in_ids, out_ids in zip(inputs.input_ids, generated_ids)
            ]
            output_text = self.processor.batch_decode(
                generated_ids_trimmed, skip_special_tokens=True, clean_up_tokenization_spaces=False
            )[0]
            
            return output_text.strip()

        except Exception as e:
            print(f"[Qwen Brain] Inference error: {e}")
            return f"Failed to generate answer due to inference error: {str(e)}"

# Global Singleton Instance
QWEN_BRAIN = QwenBrain()
