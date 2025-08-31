import os
import requests
from typing import List, Dict, Any

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
DEFAULT_CHAT_MODEL = os.getenv("LLM_MODEL", "mistral:7b-instruct")
DEFAULT_EMBED_MODEL = os.getenv("EMBED_MODEL", "nomic-embed-text")


def chat(messages: List[Dict[str, str]], model: str = DEFAULT_CHAT_MODEL, **params: Any) -> str:
	payload = {"model": model, "messages": messages, "stream": False}
	payload.update(params)
	r = requests.post(f"{OLLAMA_URL}/v1/chat/completions", json=payload, timeout=120)
	r.raise_for_status()
	data = r.json()
	return data["choices"][0]["message"]["content"]


def embed(texts: List[str], model: str = DEFAULT_EMBED_MODEL):
	r = requests.post(f"{OLLAMA_URL}/api/embeddings", json={"model": model, "input": texts}, timeout=120)
	r.raise_for_status()
	return [row["embedding"] for row in r.json().get("data", [])]
