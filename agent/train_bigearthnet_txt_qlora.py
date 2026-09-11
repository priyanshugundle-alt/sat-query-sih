"""
SatQuery AI — Full BigEarthNet.txt Parquet QLoRA Fine-Tuning Pipeline
Supports full-scale training on 100% of the BigEarthNet.txt dataset with:
- Full dataset loading (no subsampling limit when --samples 0 or --samples -1)
- Gradient Checkpointing to minimize VRAM on RTX 3050 (4 GB)
- Regular checkpointing (saves every 1000 steps so progress is never lost)
- Paged AdamW 8-bit optimizer + FP16 mixed precision
- Resume from checkpoint support
"""

import os
import sys
import argparse
from pathlib import Path
import pandas as pd
import torch

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))


def train_bigearthnet_txt_qlora(
    parquet_path: str = str(BASE_DIR / "BigEarthNet.txt" / "BigEarthNet.txt.parquet"),
    base_model_name: str = "Qwen/Qwen2.5-1.5B-Instruct",
    resume_adapter: str = str(BASE_DIR / "model_a" / "checkpoints" / "satquery_qlora_adapter"),
    output_dir: str = str(BASE_DIR / "model_a" / "checkpoints" / "satquery_bigearthnet_full_adapter"),
    num_samples: int = -1,  # -1 or 0 means 100% full dataset
    epochs: int = 1,
    batch_size: int = 2,
    grad_accum_steps: int = 8,
    lr: float = 1e-4,
    task_types: str = "captioning,mcq,binary"
):
    print("=" * 70)
    print("SATQUERY AI — FULL BIGEARTHNET.TXT QLoRA TRAINING (ALL SAMPLES)")
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
        from peft import PeftModel, LoraConfig, get_peft_model, prepare_model_for_kbit_training
        from datasets import Dataset
    except ImportError as e:
        print(f"[ERROR] Missing libraries: {e}")
        print("Run: pip install peft bitsandbytes transformers accelerate datasets pyarrow")
        sys.exit(1)

    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Device: {device}")
    if torch.cuda.is_available():
        print(f"GPU: {torch.cuda.get_device_name(0)} (VRAM: {torch.cuda.get_device_properties(0).total_memory / (1024**3):.2f} GB)")

    # 1. Load Full Parquet File
    p_path = Path(parquet_path)
    if not p_path.exists():
        raise FileNotFoundError(f"BigEarthNet.txt.parquet not found at: {p_path}")

    print(f"\n[1/5] Loading BigEarthNet.txt.parquet ({p_path.stat().st_size / (1024*1024):.1f} MB)...")
    
    try:
        df = pd.read_parquet(p_path, columns=["input", "output", "type", "split"])
    except Exception:
        df = pd.read_parquet(p_path)

    total_records = len(df)
    print(f"      Total records loaded: {total_records:,}")

    # Filter by task types if desired
    selected_types = [t.strip() for t in task_types.split(",") if t.strip()]
    if "type" in df.columns and selected_types and "all" not in selected_types:
        df_filtered = df[df["type"].isin(selected_types)]
        if len(df_filtered) > 0:
            df = df_filtered
            print(f"      Records after task-type filtering ({task_types}): {len(df):,}")

    # Use train split if present
    if "split" in df.columns:
        train_split = df[df["split"] == "train"]
        if len(train_split) > 0:
            df = train_split
            print(f"      Records in training split: {len(df):,}")

    df = df.dropna(subset=["input", "output"])

    # If num_samples is specified and > 0, sample it; otherwise use ALL!
    if num_samples > 0 and num_samples < len(df):
        df = df.sample(n=num_samples, random_state=42)
        print(f"      Selected subset: {len(df):,} samples")
    else:
        print(f"      >>> TRAINING ON ALL AVAILABLE SAMPLES: {len(df):,} QA PAIRS! <<<")

    sample_row = df.iloc[0]
    print(f"      Sample Question: {str(sample_row['input'])[:90]}...")
    print(f"      Sample Answer:   {str(sample_row['output'])[:90]}...")

    # 2. Tokenizer & 4-bit Quantization Config (NF4)
    print(f"\n[2/5] Initializing 4-Bit NormalFloat Config for {base_model_name}...")
    try:
        tokenizer = AutoTokenizer.from_pretrained(base_model_name, trust_remote_code=True)
    except Exception:
        print("      [Offline Mode] Loading tokenizer directly from local cache...")
        tokenizer = AutoTokenizer.from_pretrained(base_model_name, trust_remote_code=True, local_files_only=True)

    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_compute_dtype=torch.float16,
        bnb_4bit_use_double_quant=True
    )

    # 3. Load 4-bit Base Model
    print("\n[3/5] Loading 4-Bit Base Model...")
    try:
        base_model = AutoModelForCausalLM.from_pretrained(
            base_model_name,
            quantization_config=bnb_config,
            device_map="auto",
            trust_remote_code=True
        )
    except Exception:
        print("      [Offline Mode] Loading base model directly from local cache...")
        base_model = AutoModelForCausalLM.from_pretrained(
            base_model_name,
            quantization_config=bnb_config,
            device_map="auto",
            trust_remote_code=True,
            local_files_only=True
        )
    base_model = prepare_model_for_kbit_training(base_model)
    base_model.gradient_checkpointing_enable()  # Massive VRAM savings for long training

    # 4. Resume from previous adapter or create new LoRA
    resume_path = Path(resume_adapter)
    if resume_path.exists() and (resume_path / "adapter_config.json").exists():
        print(f"\n[4/5] Continuing fine-tuning on top of previous adapter: {resume_path}")
        model = PeftModel.from_pretrained(base_model, str(resume_path), is_trainable=True)
    else:
        print("\n[4/5] Initializing fresh LoRA adapters (r=16, alpha=32)...")
        lora_config = LoraConfig(
            r=16,
            lora_alpha=32,
            target_modules=["q_proj", "k_proj", "v_proj", "o_proj"],
            lora_dropout=0.05,
            bias="none",
            task_type="CAUSAL_LM"
        )
        model = get_peft_model(base_model, lora_config)

    # Prevent Windows from sleeping during long training runs
    if sys.platform == "win32":
        try:
            import ctypes
            ES_CONTINUOUS = 0x80000000
            ES_SYSTEM_REQUIRED = 0x00000001
            ctypes.windll.kernel32.SetThreadExecutionState(ES_CONTINUOUS | ES_SYSTEM_REQUIRED)
            print("[System] Windows Sleep Prevention ENABLED: PC will not sleep during training.")
        except Exception as e:
            print(f"[System Warning] Could not set Windows execution state: {e}")

    # Format into ChatML prompt & Tokenize efficiently
    print("\n[5/5] Tokenizing dataset with dynamic batching (memory efficient)...")
    formatted_texts = [
        f"<|im_start|>system\nYou are SatQuery AI, an expert Earth Observation and Satellite Remote Sensing AI.<|im_end|>\n"
        f"<|im_start|>user\n{str(q).strip()}<|im_end|>\n"
        f"<|im_start|>assistant\n{str(a).strip()}<|im_end|>"
        for q, a in zip(df["input"], df["output"])
    ]
    
    raw_dataset = Dataset.from_dict({"text": formatted_texts})
    del formatted_texts

    def tokenize_func(batch):
        tokens = tokenizer(
            batch["text"],
            truncation=True,
            max_length=256,
            padding=False
        )
        tokens["labels"] = [ids[:] for ids in tokens["input_ids"]]
        return tokens

    hf_dataset = raw_dataset.map(
        tokenize_func,
        batched=True,
        batch_size=1000,
        remove_columns=["text"],
        desc="Tokenizing"
    )
    del raw_dataset

    output_dir_obj = Path(output_dir)
    output_dir_obj.mkdir(parents=True, exist_ok=True)

    training_args = TrainingArguments(
        output_dir=str(output_dir_obj / "checkpoints"),
        per_device_train_batch_size=batch_size,
        gradient_accumulation_steps=grad_accum_steps,
        learning_rate=lr,
        num_train_epochs=epochs,
        fp16=torch.cuda.is_available(),
        logging_steps=50,
        save_steps=1000,
        save_total_limit=3,
        optim="paged_adamw_8bit",
        report_to="none"
    )

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=hf_dataset,
        data_collator=DataCollatorForSeq2Seq(tokenizer, pad_to_multiple_of=8)
    )

    print(f"\n>>> STARTING TRAINING ON FULL DATASET ({len(hf_dataset):,} SAMPLES) <<<")
    trainer.train()

    # Save final model
    print(f"\nSaving final full BigEarthNet adapter to: {output_dir_obj}")
    model.save_pretrained(str(output_dir_obj))
    tokenizer.save_pretrained(str(output_dir_obj))

    print("=" * 70)
    print("ALL SAMPLES QLoRA TRAINING COMPLETE!")
    print(f"Final Model Saved At: {output_dir_obj}")
    print("=" * 70)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--parquet_path", type=str, default=str(BASE_DIR / "BigEarthNet.txt" / "BigEarthNet.txt.parquet"))
    parser.add_argument("--samples", "--num_samples", dest="samples", type=int, default=15000, help="-1 or 0 for ALL samples")
    parser.add_argument("--epochs", type=int, default=1, help="Epochs (1 epoch is recommended for fast fine-tuning)")
    parser.add_argument("--batch_size", type=int, default=2, help="Batch size")
    parser.add_argument("--grad_accum", "--grad_accum_steps", dest="grad_accum", type=int, default=8, help="Gradient accumulation steps")
    parser.add_argument("--task_types", type=str, default="all", help="Comma-separated task types or 'all'")
    args = parser.parse_args()

    train_bigearthnet_txt_qlora(
        parquet_path=args.parquet_path,
        num_samples=args.samples,
        epochs=args.epochs,
        batch_size=args.batch_size,
        grad_accum_steps=args.grad_accum,
        task_types=args.task_types
    )

