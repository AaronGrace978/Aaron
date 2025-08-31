from __future__ import annotations
from typing import List, Dict, Any
from .state import AgentContext


class ShortMemory:
	KEY_PREFIX = "shortmem:"

	@classmethod
	def load(cls, thread_id: str, ctx: AgentContext | None = None) -> List[Dict[str, Any]]:
		if ctx is None:
			return []
		data = ctx.repo.get_kv("shortmem", thread_id)
		return data or []

	@classmethod
	def save(cls, thread_id: str, items: List[Dict[str, Any]], ctx: AgentContext) -> None:
		ctx.repo.upsert_kv("shortmem", thread_id, items)


class EpisodicMemory:
	@classmethod
	def save(cls, thread_id: str, summary: str, ctx: AgentContext, tags: str = "") -> int:
		return ctx.repo.add_episodic(thread_id, summary, tags)

	@classmethod
	def list(cls, thread_id: str, ctx: AgentContext, limit: int = 20) -> List[Dict[str, Any]]:
		return ctx.repo.list_episodic(thread_id, limit=limit)
