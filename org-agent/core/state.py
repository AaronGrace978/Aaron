from __future__ import annotations
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional

TASK_STATUSES = ["NEW", "PLANNED", "IN_PROGRESS", "BLOCKED", "DONE", "ABANDONED"]


@dataclass
class Task:
	id: Optional[int]
	title: str
	status: str = "NEW"
	priority: int = 0
	due: Optional[str] = None
	meta: Dict[str, Any] = field(default_factory=dict)
	steps: List[Dict[str, Any]] = field(default_factory=list)


@dataclass
class AgentContext:
	thread_id: str
	tools: Any
	repo: Any
