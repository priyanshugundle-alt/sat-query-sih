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

# Assuming the adapter is in the project root or model_a/checkpoints
ADAPTER_PATH = Path("satquery_qlora_adapter") 
if not ADAPTER_PATH.exists():
    ADAPTER_PATH = Path("model_a/checkpoints/satquery_qlora_adapter")

class QwenBrain:
    """Singleton class to load and prompt the fine-tuned Qwen-VL Super-Brain."""
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(QwenBrain, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self):
        print("[Qwen Brain] Initializing Qwen2.5-VL-3B-Instruct with 4-bit QLoRA...")
        self.model_id = "Qwen/Qwen2.5-VL-3B-Instruct"
        
        # 1. 4-bit Quantization Config (Saves massive VRAM)
        quantization_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_compute_dtype=torch.float16,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_use_double_quant=True,
        )

        # 2. Load Base Model and Processor
        try:
            self.processor = AutoProcessor.from_pretrained(self.model_id)
            base_model = Qwen2_5_VLForConditionalGeneration.from_pretrained(
                self.model_id,
                device_map="auto",
                quantization_config=quantization_config,
                torch_dtype=torch.float16
            )

            # 3. Attach QLoRA Adapter if available
            if ADAPTER_PATH.exists():
                print(f"[Qwen Brain] Attaching QLoRA Adapter from {ADAPTER_PATH}...")
                self.model = PeftModel.from_pretrained(base_model, str(ADAPTER_PATH))
                self.is_loaded = True
                print("[Qwen Brain] QLoRA Adapter attached successfully. Ready for inference.")
            else:
                print(f"[Qwen Brain] WARNING: QLoRA Adapter not found at {ADAPTER_PATH}. Running Base Qwen-VL instead.")
                self.model = base_model
                self.is_loaded = True
                
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
        if not self.is_loaded or self.model is None:
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
            generated_ids = self.model.generate(**inputs, max_new_tokens=150)
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
