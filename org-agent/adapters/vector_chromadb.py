import os
from typing import List, Tuple
import chromadb
from chromadb.utils import embedding_functions

PERSIST_DIR = os.getenv("CHROMA_DIR", "./data/indices")
EMBED_MODEL = os.getenv("EMBED_MODEL", "nomic-embed-text")

_client = chromadb.PersistentClient(path=PERSIST_DIR)


def get_collection(name: str = "org_agent"):
	return _client.get_or_create_collection(
		name=name,
		embedding_function=embedding_functions.DefaultEmbeddingFunction(),
	)


def index_texts(texts: List[str], metadatas: List[dict] | None = None, ids: List[str] | None = None) -> None:
	col = get_collection()
	ids = ids or [f"doc-{i}" for i in range(len(texts))]
	col.add(documents=texts, metadatas=metadatas, ids=ids)


def query(text: str, k: int = 6) -> List[Tuple[str, dict]]:
	col = get_collection()
	res = col.query(query_texts=[text], n_results=k)
	docs = res.get("documents", [[]])[0]
	metas = res.get("metadatas", [[]])[0]
	return list(zip(docs, metas))
