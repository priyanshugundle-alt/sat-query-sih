"""
SatQuery AI — QLoRA Fine-Tuning Pipeline for Remote Sensing Reasoning
Uses 4-bit NormalFloat (NF4) quantization + LoRA adapters (r=16, alpha=32)
Optimized for low VRAM consumption on consumer GPUs (NVIDIA RTX 3050 4GB).
"""

import os
import sys
import json
import argparse
from pathlib import Path
import torch

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))


def train_qlora(
    base_model_name: str = "Qwen/Qwen2.5-0.5B-Instruct",
    dataset_path: Path = BASE_DIR / "model_a" / "data" / "qlora_training_data.json",
    output_dir: Path = BASE_DIR / "model_a" / "checkpoints" / "satquery_qlora_adapter",
    epochs: int = 3,
    batch_size: int = 2,
    grad_accum_steps: int = 4,
    lr: float = 2e-4
):
    print("=" * 70)
    print("SATQUERY AI — QLoRA FINE-TUNING PIPELINE")
    print("=" * 70)

    try:
        from transformers import (
            AutoModelForCausalLM,
            AutoTokenizer,
            BitsAndBytesConfig,
            TrainingArguments,
            Trainer,
            DataCollatorForSeq2Seq
        )
        from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
        from datasets import Dataset
    except ImportError as e:
        print(f"\n[ERROR] Missing required libraries: {e}")
        print("Please install them first with:")
        print("  pip install peft bitsandbytes transformers accelerate datasets trl")
        sys.exit(1)

    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Device: {device}")
    if torch.cuda.is_available():
        print(f"GPU: {torch.cuda.get_device_name(0)}")
        print(f"Available VRAM: {torch.cuda.get_device_properties(0).total_memory / (1024**3):.2f} GB")

    # 1. Load Dataset
    print(f"\n[1/5] Loading instruction dataset from: {dataset_path}")
    if not dataset_path.exists():
        from agent.generate_qlora_dataset import generate_dataset
        generate_dataset(dataset_path)

    with open(dataset_path, "r", encoding="utf-8") as f:
        raw_data = json.load(f)
    print(f"      Total samples: {len(raw_data)}")

    # 2. Tokenizer & 4-bit Quantization Config (NF4)
    print(f"\n[2/5] Initializing Tokenizer & 4-Bit BitsAndBytes Config ({base_model_name})...")
    tokenizer = AutoTokenizer.from_pretrained(base_model_name, trust_remote_code=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_compute_dtype=torch.float16,
        bnb_4bit_use_double_quant=True
    )

    # 3. Load Model with 4-bit Quantization
    print("\n[3/5] Loading 4-Bit Base Model...")
    model = AutoModelForCausalLM.from_pretrained(
        base_model_name,
        quantization_config=bnb_config,
        device_map="auto",
        trust_remote_code=True
    )
    model = prepare_model_for_kbit_training(model)

    # 4. Attach LoRA Adapters
    print("\n[4/5] Injecting LoRA Adapters (r=16, alpha=32)...")
    lora_config = LoraConfig(
        r=16,
        lora_alpha=32,
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj"],
        lora_dropout=0.05,
        bias="none",
        task_type="CAUSAL_LM"
    )
    model = get_peft_model(model, lora_config)
    model.print_trainable_parameters()

    # Format text for instruction tuning
    formatted_texts = []
    for item in raw_data:
        prompt = (
            f"<|im_start|>system\nYou are SatQuery AI, an expert Earth Observation and Remote Sensing AI.<|im_end|>\n"
            f"<|im_start|>user\n{item['instruction']}\nContext: {item['input']}<|im_end|>\n"
            f"<|im_start|>assistant\n{item['output']}<|im_end|>"
        )
        formatted_texts.append(prompt)

    # Tokenize
    tokenized = tokenizer(
        formatted_texts,
        truncation=True,
        max_length=512,
        padding="max_length"
    )
    tokenized["labels"] = [list(ids) for ids in tokenized["input_ids"]]
    hf_dataset = Dataset.from_dict(tokenized)

    # 5. Training Arguments & Trainer
    print("\n[5/5] Starting QLoRA Training...")
    output_dir.mkdir(parents=True, exist_ok=True)
    training_args = TrainingArguments(
        output_dir=str(output_dir / "checkpoints"),
        per_device_train_batch_size=batch_size,
        gradient_accumulation_steps=grad_accum_steps,
        learning_rate=lr,
        num_train_epochs=epochs,
        fp16=torch.cuda.is_available(),
        logging_steps=10,
        save_strategy="epoch",
        optim="paged_adamw_8bit",
        report_to="none"
    )

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=hf_dataset,
        data_collator=DataCollatorForSeq2Seq(tokenizer, pad_to_multiple_of=8)
    )

    trainer.train()

    # Save final LoRA adapter
    print(f"\nSaving fine-tuned QLoRA adapter to: {output_dir}")
    model.save_pretrained(str(output_dir))
    tokenizer.save_pretrained(str(output_dir))

    print("=" * 70)
    print("QLoRA FINE-TUNING COMPLETED SUCCESSFULLY!")
    print(f"Adapter saved at: {output_dir}")
    print("=" * 70)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", type=str, default="Qwen/Qwen2.5-0.5B-Instruct", help="Base model name")
    parser.add_argument("--epochs", type=int, default=3, help="Number of epochs")
    parser.add_argument("--batch_size", type=int, default=2, help="Batch size")
    args = parser.parse_args()

    train_qlora(base_model_name=args.model, epochs=args.epochs, batch_size=args.batch_size)
