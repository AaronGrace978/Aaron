from core.planner import plan_tasks, critique_plan

def test_plan_outputs_structure(monkeypatch):
	def fake_chat(messages, **kwargs):
		return '{"steps": [{"action": "think", "note": "ok"}], "summary": "done"}'
	monkeypatch.setattr('adapters.llm_ollama.chat', fake_chat)
	plan = plan_tasks("do stuff", support=[], mem=[])
	assert isinstance(plan, dict)
	assert "steps" in plan and isinstance(plan["steps"], list)
	crit = critique_plan(plan)
	assert isinstance(crit, dict)
