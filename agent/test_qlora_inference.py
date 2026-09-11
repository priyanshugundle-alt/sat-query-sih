"""
SatQuery AI — Test Fine-Tuned QLoRA Adapter Inference
Loads base model in 4-bit, attaches the fine-tuned LoRA adapter, and generates answers.
"""

import sys
from pathlib import Path
import torch

BASE_DIR = Path(__file__).resolve().parent.parent

try:
    from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
    from peft import PeftModel
except ImportError:
    print("Please install transformers and peft: pip install transformers peft bitsandbytes")
    sys.exit(1)


def test_qlora(
    base_model_name: str = "Qwen/Qwen2.5-1.5B-Instruct",
    adapter_path: Path = None
):
    if adapter_path is None:
        full_adapter = BASE_DIR / "model_a" / "checkpoints" / "satquery_bigearthnet_full_adapter"
        default_adapter = BASE_DIR / "model_a" / "checkpoints" / "satquery_qlora_adapter"
        adapter_path = full_adapter if full_adapter.exists() else default_adapter

    print(f"Loading Base Model ({base_model_name}) + QLoRA Adapter from: {adapter_path}")

    
    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_compute_dtype=torch.float16
    )

    tokenizer = AutoTokenizer.from_pretrained(str(adapter_path), trust_remote_code=True)
    base_model = AutoModelForCausalLM.from_pretrained(
        base_model_name,
        quantization_config=bnb_config,
        device_map="auto",
        trust_remote_code=True
    )

    model = PeftModel.from_pretrained(base_model, str(adapter_path))
    model.eval()

    questions = [
        "Analyze the land-cover distribution and dominant terrain features for this satellite scene.",
        "Is there any evidence of water bodies, wetlands, or flood inundation in this observation?"
    ]

    context = "Detected Classes: Inland waters, Coniferous forest. Mean VV: -21.40 dB, Mean VH: -19.20 dB."

    for q in questions:
        prompt = (
            f"<|im_start|>system\nYou are SatQuery AI, an expert Earth Observation and Remote Sensing AI.<|im_end|>\n"
            f"<|im_start|>user\n{q}\nContext: {context}<|im_end|>\n"
            f"<|im_start|>assistant\n"
        )
        inputs = tokenizer(prompt, return_tensors="pt").to("cuda" if torch.cuda.is_available() else "cpu")

        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_new_tokens=150,
                temperature=0.3,
                top_p=0.9,
                do_sample=True,
                pad_token_id=tokenizer.eos_token_id
            )

        answer = tokenizer.decode(outputs[0][inputs.input_ids.shape[1]:], skip_special_tokens=True)
        print("\n" + "=" * 60)
        print("QUESTION:", q)
        print("MODEL ANSWER:\n", answer.strip())


if __name__ == "__main__":
    test_qlora()
