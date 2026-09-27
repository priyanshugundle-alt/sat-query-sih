"""
SatQuery AI — Kaggle Qwen2.5-VL-7B-Instruct QLoRA Training & Weight Merge Script
Run this notebook script on Kaggle (Accelerators: GPU T4 x2 or GPU P100 / A100).

Instructions:
1. Enable GPU in Kaggle Notebook settings (Accelerator: GPU T4 x2).
2. Set Environment Secrets: HF_TOKEN (HuggingFace token with write access if pushing to hub).
3. Output directory will produce `merged_model/` containing the fused 7B weights.
"""

import os
import torch
from pathlib import Path

# 1. Install & Import Required Libraries
print("Installing Unsloth / Hugging Face PEFT & Transformers for Qwen2.5-VL-7B...")
os.system("pip install -q --upgrade pip")
os.system("pip install -q git+https://github.com/huggingface/transformers.git")
os.system("pip install -q peft trl bitsandbytes accelerate datasets torchvision pillow qwen-vl-utils")

from transformers import AutoProcessor, Qwen2_5_VLForConditionalGeneration, BitsAndBytesConfig
from peft import LoraConfig, get_peft_model, TaskType

MODEL_ID = "Qwen/Qwen2.5-VL-7B-Instruct"
OUTPUT_DIR = Path("./output/merged_model")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

print(f"Loading Base Model: {MODEL_ID} with 4-bit Quantization...")

# 2. Configure 4-bit Quantization (fits comfortably inside 15GB T4 GPU VRAM)
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.bfloat16 if torch.cuda.is_available() and torch.cuda.is_bf16_supported() else torch.float16,
    bnb_4bit_use_double_quant=True
)

processor = AutoProcessor.from_pretrained(MODEL_ID, trust_remote_code=True)
model = Qwen2_5_VLForConditionalGeneration.from_pretrained(
    MODEL_ID,
    quantization_config=bnb_config,
    device_map="auto",
    trust_remote_code=True
)

# 3. Configure LoRA Adapter
peft_config = LoraConfig(
    r=16,
    lora_alpha=32,
    lora_dropout=0.05,
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
    bias="none",
    task_type="CAUSAL_LM"
)

model = get_peft_model(model, peft_config)
model.print_trainable_parameters()

print("\n--- Training Instructions ---")
print("1. Pass your Earth Observation QA dataset (JSONL with image_path & query/response pairs).")
print("2. Train for 3-5 epochs using SFTTrainer.")
print("3. After training, run model.save_pretrained('./output/lora_adapter').")
print("4. Merge LoRA weights into base model and download `merged_model/` to your local machine at:")
print("   `D:\\SIH\\sat-query-sih\\model_server\\model_weights\\merged_model`")

def merge_and_export(base_model_id, lora_adapter_dir, export_dir):
    """Merges 7B LoRA weights with 16-bit precision base model for standalone offline serving."""
    print("Merging LoRA weights into standalone 7B model...")
    from peft import PeftModel
    
    base_model = Qwen2_5_VLForConditionalGeneration.from_pretrained(
        base_model_id,
        torch_dtype=torch.float16,
        device_map="cpu",
        trust_remote_code=True
    )
    merged_model = PeftModel.from_pretrained(base_model, lora_adapter_dir)
    merged_model = merged_model.merge_and_unload()
    
    merged_model.save_pretrained(export_dir)
    processor.save_pretrained(export_dir)
    print(f"✅ Successfully exported merged 7B weights to: {export_dir}")

if __name__ == "__main__":
    print("Kaggle Qwen2.5-VL-7B training script template initialized.")
