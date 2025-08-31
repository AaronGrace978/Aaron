from __future__ import annotations
from typing import List, Dict, Any
from adapters import vector_chromadb as vec


def index_documents(docs: List[str], metadatas: List[dict] | None = None) -> None:
	vec.index_texts(docs, metadatas=metadatas)


def query(text: str, k: int = 6) -> List[Dict[str, Any]]:
	pairs = vec.query(text, k=k)
	return [{"text": t, "meta": m} for t, m in pairs]
