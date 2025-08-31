from __future__ import annotations
from typing import Any, Dict, Callable


TOOL_SPEC: Dict[str, Dict[str, Any]] = {
	"read_email": {
		"description": "Fetch recent emails with optional query.",
		"parameters": {
			"type": "object",
			"properties": {"query": {"type": "string"}, "limit": {"type": "integer", "default": 20}},
			"required": [],
		},
	},
	"create_event": {
		"description": "Create calendar event.",
		"parameters": {
			"type": "object",
			"properties": {
				"title": {"type": "string"},
				"start": {"type": "string", "description": "ISO8601"},
				"end": {"type": "string", "description": "ISO8601"},
				"attendees": {"type": "array", "items": {"type": "string"}},
			},
			"required": ["title", "start", "end"],
		},
	},
	"list_tasks": {
		"description": "List tasks from storage.",
		"parameters": {"type": "object", "properties": {"status": {"type": "string"}, "limit": {"type": "integer"}}, "required": []},
	},
	"update_task": {
		"description": "Update a task.",
		"parameters": {"type": "object", "properties": {"id": {"type": "integer"}, "fields": {"type": "object"}}, "required": ["id", "fields"]},
	},
	"wait_until": {
		"description": "Pause plan until a condition/time.",
		"parameters": {"type": "object", "properties": {"until": {"type": "string"}}, "required": ["until"]},
	},
}


class ToolRouter:
	def __init__(self, repo: Any) -> None:
		self.repo = repo
		self.handlers: Dict[str, Callable[[Dict[str, Any]], Any]] = {
			"list_tasks": self._list_tasks,
			"update_task": self._update_task,
		}

	def call(self, name: str, args: Dict[str, Any]) -> Any:
		handler = self.handlers.get(name)
		if not handler:
			return {"error": f"unknown tool: {name}"}
		return handler(args)

	def _list_tasks(self, args: Dict[str, Any]) -> Any:
		return self.repo.list_tasks(status=args.get("status"), limit=args.get("limit", 50))

	def _update_task(self, args: Dict[str, Any]) -> Any:
		self.repo.update_task(args["id"], **args.get("fields", {}))
		return {"ok": True}
