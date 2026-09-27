import sys
import time
import json
import argparse
import urllib.request
from pathlib import Path

SERVER_URL = "http://127.0.0.1:5000/analyze"

def query_model(task: str, image_path: str, question: str = "", image_t2_path: str = None):
    p = Path(image_path)
    if not p.is_absolute():
        p = Path(__file__).resolve().parent / p
        
    if not p.exists():
        print(f"[-] Error: Image path '{p}' does not exist.")
        return None

    images = [str(p)]
    if image_t2_path:
        p2 = Path(image_t2_path)
        if not p2.is_absolute():
            p2 = Path(__file__).resolve().parent / p2
        if p2.exists():
            images.append(str(p2))

    payload = {
        "task": task,
        "query": question or "",
        "image_paths": images
    }

    print("\n" + "="*70)
    print(f"[*] Task     : {task}")
    print(f"[*] Image    : {p.name}")
    if question:
        print(f"[*] Question : {question}")
    print("="*70)
    print("[...] Running inference on fine-tuned Qwen model (port 5000)...")

    t0 = time.time()
    req = urllib.request.Request(
        SERVER_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )

    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            elapsed = time.time() - t0
            data = json.loads(resp.read().decode("utf-8"))
            print(f"[+] Response Time : {elapsed:.2f} seconds")
            print(f"[+] Output / Answer:")
            print(f"    >>> {data.get('answer') or data.get('response') or data.get('caption')}")
            if "confidence" in data:
                print(f"[+] Confidence    : {data['confidence'] * 100:.1f}%")
            if "detected_classes" in data and data["detected_classes"]:
                print(f"[+] Detected Classes : {data['detected_classes']}")
            return data
    except Exception as e:
        print(f"[-] Inference Error: {e}")
        return None

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="SatQuery Fast Model Tester")
    parser.add_argument("--image", type=str, default="samples/airport_sample.jpg", help="Path to satellite image")
    parser.add_argument("--query", type=str, default="What type of facility is visible?", help="Question for VQA")
    parser.add_argument("--task", type=str, default="VQA", choices=["VQA", "CAPTIONING", "CHANGE_ANALYSIS", "GROUNDING"])
    parser.add_argument("--image2", type=str, default=None, help="Second image for change detection")
    
    args = parser.parse_args()

    print("\n" + "#"*70)
    print("   SATQUERY AI -- INSTANT SATELLITE MODEL TESTER")
    print("#"*70)

    query_model(
        task=args.task,
        image_path=args.image,
        question=args.query,
        image_t2_path=args.image2
    )
