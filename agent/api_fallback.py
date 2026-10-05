"""
SatQuery AI — Multi-Provider Cloud LLM/VLM API Fallback Engine

Supports Task-Specialized Provider Routing:
1. Google Gemini API (Recommended for Visual Tasks: VQA, Grounding, Captioning, Fusion)
2. GroqCloud API (Recommended for Ultra-Fast Text Tasks: Change Reasoning & Extraction)
3. NVIDIA NIM API (Recommended for Open-Weight Deep Extraction)
4. OpenRouter / OpenAI APIs (Universal Aggregators)
"""

import os
import sys
import json
import base64
import urllib.request
import urllib.error
from pathlib import Path
from typing import Optional, Dict, Any, List

ROOT_DIR = Path(__file__).resolve().parent.parent

# Helper to automatically load .env files without requiring python-dotenv package
def load_env_file():
    env_paths = [
        ROOT_DIR / ".env",
        ROOT_DIR / "model_server" / ".env",
        ROOT_DIR / "backend" / ".env"
    ]
    for env_path in env_paths:
        if env_path.exists():
            try:
                with open(env_path, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            k, v = line.split("=", 1)
                            k = k.strip()
                            v = v.strip().strip("'\"")
                            if k and v and len(v) > 5:
                                os.environ[k] = v
            except Exception as e:
                print(f"[ApiFallback] Notice reading .env file {env_path}: {e}")

load_env_file()


class SatQueryApiFallback:
    """
    Task-Aware Multi-Provider Satellite VLM Fallback Engine.
    """
    
    @staticmethod
    def get_api_key(prefer_vision: bool = True) -> tuple[Optional[str], str]:
        """
        Returns (api_key, provider_name) based on task specialty and valid key prefix.
        """
        gemini_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
        groq_key = os.environ.get("GROQ_API_KEY")
        nvidia_key = os.environ.get("NVIDIA_API_KEY")
        openrouter_key = os.environ.get("OPENROUTER_API_KEY")
        openai_key = os.environ.get("OPENAI_API_KEY")

        # Helper validator
        is_gemini = lambda k: k and (k.startswith("AQ.") or k.startswith("AIzaSy") or len(k) > 20)
        is_groq = lambda k: k and k.startswith("gsk_")
        is_nvidia = lambda k: k and (k.startswith("nvapi-") or len(k) > 20)
        is_openrouter = lambda k: k and (k.startswith("sk-or-") or len(k) > 20)
        is_openai = lambda k: k and (k.startswith("sk-") or len(k) > 20)

        if prefer_vision:
            if is_gemini(gemini_key):
                return gemini_key, "gemini"
            if is_openai(openai_key):
                return openai_key, "openai"
            if is_openrouter(openrouter_key):
                return openrouter_key, "openrouter"
            if is_groq(groq_key):
                return groq_key, "groq"
            if is_nvidia(nvidia_key):
                return nvidia_key, "nvidia"
        else:
            if is_groq(groq_key):
                return groq_key, "groq"
            if is_gemini(gemini_key):
                return gemini_key, "gemini"
            if is_nvidia(nvidia_key):
                return nvidia_key, "nvidia"
            if is_openrouter(openrouter_key):
                return openrouter_key, "openrouter"
            if is_openai(openai_key):
                return openai_key, "openai"

        # Fallback if any key >= 10 chars is present
        for k, name in [(gemini_key, "gemini"), (groq_key, "groq"), (nvidia_key, "nvidia"), (openrouter_key, "openrouter"), (openai_key, "openai")]:
            if k and len(k) >= 10:
                return k, name

        return None, "none"

    @classmethod
    def is_available(cls) -> bool:
        key, provider = cls.get_api_key()
        return key is not None and len(key.strip()) > 5

    @classmethod
    def query_vlm_api(
        cls,
        query: str,
        detected_classes: Optional[List[str]] = None,
        modality: str = "Optical",
        image_path: Optional[str] = None,
        context_extra: str = ""
    ) -> Optional[str]:
        """
        Queries selected cloud VLM API provider with task-specialized routing.
        """
        is_visual_task = image_path is not None or any(k in (modality or "").lower() for k in ["optical", "sar", "fusion"])
        key, provider = cls.get_api_key(prefer_vision=is_visual_task)
        if not key:
            return None

        print(f"[SatQuery Neural Engine] Task-Specialized Query routed to SatQuery RS-VLM Pipeline")

        classes_str = ", ".join(detected_classes[:4]) if detected_classes else "Raster Features"
        system_prompt = (
            "You are SatQuery AI, an interactive AI assistant specialized in multi-modal satellite imagery analysis, "
            "remote sensing, change detection, and spatial intelligence. "
            "If the user says 'hi', 'hello', or introduces themselves, greet them warmly as SatQuery AI and briefly state how you can assist with satellite imagery queries. "
            "For all analytical queries, provide direct, precise, scientific responses strictly focused on the question and satellite intelligence domain."
        )

        user_content = (
            f"User Message/Query: {query}\n"
            f"Sensor Modality Context: {modality}\n"
            f"Raster Features: {classes_str}\n"
            f"{context_extra}\n"
            "Response:"
        )

        try:
            if provider == "gemini":
                return cls._call_gemini(key, system_prompt, user_content, image_path)
            elif provider == "groq":
                return cls._call_groq(key, system_prompt, user_content)
            elif provider == "nvidia":
                return cls._call_nvidia(key, system_prompt, user_content)
            elif provider == "openrouter":
                return cls._call_openrouter(key, system_prompt, user_content)
            elif provider == "openai":
                return cls._call_openai(key, system_prompt, user_content)
        except Exception as e:
            print(f"[SatQuery ApiFallback Error via {provider.upper()}]: {e}")
            # Try fallback to Gemini if primary fails
            if provider != "gemini":
                gemini_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
                if gemini_key:
                    print("[SatQuery Neural Engine] Engaging Primary Vision-Language Backbone...")
                    return cls._call_gemini(gemini_key, system_prompt, user_content, image_path)
            return None

    @classmethod
    def _call_gemini(cls, api_key: str, system_prompt: str, prompt: str, image_path: Optional[str]) -> Optional[str]:
        parts = [{"text": f"{system_prompt}\n\n{prompt}"}]

        if image_path and os.path.exists(image_path) and str(image_path).lower().endswith((".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif", ".bmp", ".tif", ".tiff")):
            try:
                with open(image_path, "rb") as img_f:
                    img_b64 = base64.b64encode(img_f.read()).decode("utf-8")
                    ext = Path(image_path).suffix.lower()
                    mime_map = {
                        ".png": "image/png",
                        ".webp": "image/webp",
                        ".gif": "image/gif",
                        ".bmp": "image/bmp",
                        ".avif": "image/avif",
                        ".tif": "image/tiff",
                        ".tiff": "image/tiff"
                    }
                    mime = mime_map.get(ext, "image/jpeg")
                    parts.append({
                        "inline_data": {
                            "mime_type": mime,
                            "data": img_b64
                        }
                    })
            except Exception as ie:
                print(f"[ApiFallback Gemini Image Encode Warning]: {ie}")

        payload = {
            "contents": [{"parts": parts}],
            "generationConfig": {"temperature": 0.2, "maxOutputTokens": 300}
        }

        # Try gemini-flash-lite-latest, gemini-3.8-flash, gemini-3.5-flash, gemini-flash-latest in sequence
        candidate_models = ["gemini-flash-lite-latest", "gemini-3.8-flash", "gemini-3.5-flash", "gemini-flash-latest", "gemini-2.5-flash"]
        for model_name in candidate_models:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
            try:
                req = urllib.request.Request(
                    url,
                    data=json.dumps(payload).encode("utf-8"),
                    headers={
                        "Content-Type": "application/json",
                        "X-goog-api-key": api_key
                    },
                    method="POST"
                )
                with urllib.request.urlopen(req, timeout=12) as resp:
                    data = json.loads(resp.read().decode("utf-8"))
                    candidates = data.get("candidates", [])
                    if candidates:
                        parts_out = candidates[0].get("content", {}).get("parts", [])
                        if parts_out:
                            return parts_out[0].get("text", "").strip()
            except urllib.error.HTTPError as he:
                if he.code in (404, 503):
                    continue
                else:
                    print(f"[ApiFallback Gemini {model_name} HTTP {he.code}]: {he}")
            except Exception as e:
                print(f"[ApiFallback Gemini {model_name} error]: {e}")
        return None

    @classmethod
    def _call_groq(cls, api_key: str, system_prompt: str, prompt: str) -> Optional[str]:
        url = "https://api.groq.com/openai/v1/chat/completions"
        payload = {
            "model": "llama-3.3-70b-versatile",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.2,
            "max_tokens": 300
        }
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json", "Authorization": f"Bearer {api_key}"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            choices = data.get("choices", [])
            if choices:
                return choices[0].get("message", {}).get("content", "").strip()
        return None

    @classmethod
    def _call_nvidia(cls, api_key: str, system_prompt: str, prompt: str) -> Optional[str]:
        url = "https://integrate.api.nvidia.com/v1/chat/completions"
        payload = {
            "model": "meta/llama-3.3-70b-instruct",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.2,
            "max_tokens": 300
        }
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json", "Authorization": f"Bearer {api_key}"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            choices = data.get("choices", [])
            if choices:
                return choices[0].get("message", {}).get("content", "").strip()
        return None

    @classmethod
    def _call_openrouter(cls, api_key: str, system_prompt: str, prompt: str) -> Optional[str]:
        url = "https://openrouter.ai/api/v1/chat/completions"
        payload = {
            "model": "google/gemini-2.0-flash-001",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.2,
            "max_tokens": 300
        }
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json", "Authorization": f"Bearer {api_key}"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            choices = data.get("choices", [])
            if choices:
                return choices[0].get("message", {}).get("content", "").strip()
        return None

    @classmethod
    def _call_openai(cls, api_key: str, system_prompt: str, prompt: str) -> Optional[str]:
        url = "https://api.openai.com/v1/chat/completions"
        payload = {
            "model": "gpt-4o-mini",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.2,
            "max_tokens": 300
        }
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json", "Authorization": f"Bearer {api_key}"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            choices = data.get("choices", [])
            if choices:
                return choices[0].get("message", {}).get("content", "").strip()
        return None
