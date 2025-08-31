from core.state import AgentContext
from core.tools import ToolRouter
from adapters.storage_sqlite import Repository, init_db
from core.agent import run_agent

if __name__ == '__main__':
	init_db()
	repo = Repository()
	ctx = AgentContext(thread_id='smoke', tools=ToolRouter(repo), repo=repo)
	plan, summary = run_agent('Create a simple plan for today', ctx)
	print('SUMMARY:', summary)
	print('PLAN_STEPS:', len(plan.get('steps', [])))
