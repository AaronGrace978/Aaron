from __future__ import annotations
from typing import Dict, Any
from .planner import plan_tasks, critique_plan
from .memory import ShortMemory, EpisodicMemory
from .state import AgentContext


def run_agent(user_msg: str, ctx: AgentContext) -> tuple[Dict[str, Any], str]:
	# 1) retrieve context
	support = []
	try:
		# Lazy import to avoid optional chromadb dependency at import time
		from . import retrieval  # type: ignore
		support = retrieval.query(user_msg, k=6)
	except Exception:
		support = []
	mem = ShortMemory.load(ctx.thread_id, ctx=ctx)

	# 2) planning
	plan = plan_tasks(user_msg, support, mem)
	critique = critique_plan(plan)
	if critique.get("revise"):
		plan = plan_tasks(user_msg, support, mem, critique=critique)

	# 3) act (tool calls only where needed)
	for step in plan.get("steps", []):
		if step.get("action") == "tool":
			tool_name, args = step.get("tool"), step.get("args", {})
			result = ctx.tools.call(tool_name, args)
			step["result"] = result

	# 4) reflect & store
	summary = plan.get("summary") or f"Planned {len(plan.get('steps', []))} steps."
	EpisodicMemory.save(ctx.thread_id, summary, ctx=ctx)
	return plan, summary
