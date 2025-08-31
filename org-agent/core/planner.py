from __future__ import annotations
from typing import List, Dict, Any
from adapters.llm_ollama import chat


def plan_tasks(user_msg: str, support: List[Dict[str, Any]], mem: List[Dict[str, Any]], critique: Dict[str, Any] | None = None) -> Dict[str, Any]:
	context = "\n".join([f"CTX: {s.get('text','')}" for s in support])
	memory = "\n".join([f"MEM: {m}" for m in mem])
	crit = f"Notes: {critique.get('notes')}" if critique else ""
	prompt = (
		"You are planning tasks for an organization agent.\n"
		f"User: {user_msg}\n{context}\n{memory}\n{crit}\n"
		"Output a JSON with fields: steps (list of {action:'tool'|'think'|'say', tool, args}), and summary."
	)
	resp = chat([
		{"role": "system", "content": "Plan then act. Prefer tools for operations."},
		{"role": "user", "content": prompt},
	], temperature=0.3)
	# naive parse fallback
	plan: Dict[str, Any] = {"steps": [], "summary": ""}
	try:
		import json
		plan = json.loads(resp)
	except Exception:
		plan["steps"].append({"action": "think", "note": resp[:400]})
	return plan


def critique_plan(plan: Dict[str, Any]) -> Dict[str, Any]:
	text = str(plan)
	resp = chat([
		{"role": "system", "content": "Score plan for clarity, feasibility, risk, time."},
		{"role": "user", "content": text + "\nRespond JSON: {\"revise\":bool, \"notes\":string}"},
	], temperature=0.0)
	try:
		import json
		return json.loads(resp)
	except Exception:
		return {"revise": False}
