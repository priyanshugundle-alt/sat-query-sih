"""
SatQuery AI — Custom QA Dataset QLoRA Fine-Tuning Pipeline
Supports:
- JSON, JSONL, and CSV file formats
- Flexible column detection (question/answer, instruction/output, prompt/response)
- Continual fine-tuning on top of existing LoRA adapters (e.g. satquery_qlora_adapter)
- Memory-efficient 4-bit NF4 training on RTX 3050 (4 GB VRAM)
"""

import os
import sys
import json
import argparse
from pathlib import Path
import pandas as pd
import torch

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))


def load_custom_dataset(file_path: Path):
    """Loads custom QA pairs from JSON, JSONL, or CSV and standardizes format."""
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"Custom dataset file not found at: {path}")

    records = []
    suffix = path.suffix.lower()

    if suffix == ".json":
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
            if isinstance(data, list):
                records = data
            elif isinstance(data, dict):
                # Check for common list keys
                for k in ["data", "questions", "qa", "samples"]:
                    if k in data and isinstance(data[k], list):
                        records = data[k]
                        break
                if not records:
                    records = [data]

    elif suffix == ".jsonl":
        with open(path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line:
                    records.append(json.loads(line))

    elif suffix in [".csv", ".tsv"]:
        sep = "\t" if suffix == ".tsv" else ","
        df = pd.read_csv(path, sep=sep)
        records = df.to_dict(orient="records")

    else:
        raise ValueError(f"Unsupported file format: {suffix}. Please provide a .json, .jsonl, or .csv file.")

    formatted = []
    for item in records:
        q, a = None, None

        # Question mapping
        for q_key in ["question", "instruction", "prompt", "query", "input_text", "user"]:
            if q_key in item and item[q_key]:
                q = str(item[q_key]).strip()
                break

        # Answer mapping
        for a_key in ["answer", "output", "response", "target", "label", "assistant", "completion"]:
            if a_key in item and item[a_key]:
                a = str(item[a_key]).strip()
                break

        # If item has messages format (ChatML)
        if not q and "messages" in item:
            msgs = item["messages"]
            for m in msgs:
                if m.get("role") == "user":
                    q = m.get("content")
                elif m.get("role") == "assistant":
                    a = m.get("content")

        if q and a:
            formatted.append({"question": q, "answer": a})

    if not formatted:
        raise ValueError(f"Could not find valid Question/Answer pairs in {path}. Sample keys found: {list(records[0].keys()) if records else 'empty'}")

    return formatted


def train_custom_qa(
    dataset_path: str,
    base_model_name: str = "Qwen/Qwen2.5-1.5B-Instruct",
    resume_adapter: str = str(BASE_DIR / "model_a" / "checkpoints" / "satquery_qlora_adapter"),
    output_dir: str = str(BASE_DIR / "model_a" / "checkpoints" / "satquery_custom_qlora_adapter"),
    epochs: int = 3,
    batch_size: int = 2,
    grad_accum_steps: int = 4,
    lr: float = 1e-4
):
    print("=" * 70)
    print("SATQUERY AI — CUSTOM QA DATASET QLoRA TRAINING")
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
        sys.exit(1)

    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Device: {device}")
    if torch.cuda.is_available():
        print(f"GPU: {torch.cuda.get_device_name(0)} (VRAM: {torch.cuda.get_device_properties(0).total_memory / (1024**3):.2f} GB)")

    # 1. Load Dataset
    print(f"\n[1/5] Loading and parsing custom dataset from: {dataset_path}")
    qa_pairs = load_custom_dataset(Path(dataset_path))
    print(f"      Successfully extracted {len(qa_pairs)} clean Question-Answer pairs!")
    print(f"      Sample Question: {qa_pairs[0]['question'][:90]}...")
    print(f"      Sample Answer:   {qa_pairs[0]['answer'][:90]}...")

    # 2. Tokenizer & 4-bit Quantization Config
    print(f"\n[2/5] Initializing 4-Bit NormalFloat Config for {base_model_name}...")
    tokenizer = AutoTokenizer.from_pretrained(base_model_name, trust_remote_code=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_compute_dtype=torch.float16,
        bnb_4bit_use_double_quant=True
    )

    # 3. Load Model
    print("\n[3/5] Loading 4-Bit Base Model...")
    base_model = AutoModelForCausalLM.from_pretrained(
        base_model_name,
        quantization_config=bnb_config,
        device_map="auto",
        trust_remote_code=True
    )
    base_model = prepare_model_for_kbit_training(base_model)

    # 4. Resume from previous adapter or create new LoRA
    adapter_path_obj = Path(resume_adapter)
    if adapter_path_obj.exists() and (adapter_path_obj / "adapter_config.json").exists():
        print(f"\n[4/5] Loading previous LoRA weights from: {adapter_path_obj}")
        model = PeftModel.from_pretrained(base_model, str(adapter_path_obj), is_trainable=True)
        print("      Continuing fine-tuning on top of existing remote-sensing adapter!")
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

    model.print_trainable_parameters()

    # Format into ChatML prompt
    formatted_texts = []
    for item in qa_pairs:
        prompt = (
            f"<|im_start|>system\nYou are SatQuery AI, an expert Earth Observation, Satellite Remote Sensing, and Geospatial AI.<|im_end|>\n"
            f"<|im_start|>user\n{item['question']}<|im_end|>\n"
            f"<|im_start|>assistant\n{item['answer']}<|im_end|>"
        )
        formatted_texts.append(prompt)

    # Tokenize
    print("\n[5/5] Tokenizing dataset and preparing Trainer...")
    tokenized = tokenizer(
        formatted_texts,
        truncation=True,
        max_length=512,
        padding="max_length"
    )
    tokenized["labels"] = [list(ids) for ids in tokenized["input_ids"]]
    hf_dataset = Dataset.from_dict(tokenized)

    output_dir_obj = Path(output_dir)
    output_dir_obj.mkdir(parents=True, exist_ok=True)

    training_args = TrainingArguments(
        output_dir=str(output_dir_obj / "checkpoints"),
        per_device_train_batch_size=batch_size,
        gradient_accumulation_steps=grad_accum_steps,
        learning_rate=lr,
        num_train_epochs=epochs,
        fp16=torch.cuda.is_available(),
        logging_steps=max(1, len(hf_dataset) // (batch_size * grad_accum_steps * 10)),
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

    print("\n>>> STARTING TRAINING WITH YOUR CUSTOM DATASET <<<")
    trainer.train()

    # Save final model
    print(f"\nSaving final custom adapter to: {output_dir_obj}")
    model.save_pretrained(str(output_dir_obj))
    tokenizer.save_pretrained(str(output_dir_obj))

    print("=" * 70)
    print("CUSTOM QLoRA FINE-TUNING COMPLETE!")
    print(f"New Adapter Saved At: {output_dir_obj}")
    print("=" * 70)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--dataset_path", type=str, required=True, help="Path to your custom QA dataset (.json, .jsonl, or .csv)")
    parser.add_argument("--base_model", type=str, default="Qwen/Qwen2.5-1.5B-Instruct", help="Base model name")
    parser.add_argument("--epochs", type=int, default=3, help="Number of epochs")
    parser.add_argument("--batch_size", type=int, default=2, help="Batch size")
    parser.add_argument("--resume_adapter", type=str, default=str(BASE_DIR / "model_a" / "checkpoints" / "satquery_qlora_adapter"), help="Path to previous adapter to continue training")
    parser.add_argument("--output_dir", type=str, default=str(BASE_DIR / "model_a" / "checkpoints" / "satquery_custom_qlora_adapter"), help="Output directory")

    args = parser.parse_args()
    train_custom_qa(
        dataset_path=args.dataset_path,
        base_model_name=args.base_model,
        resume_adapter=args.resume_adapter,
        output_dir=args.output_dir,
        epochs=args.epochs,
        batch_size=args.batch_size
    )
