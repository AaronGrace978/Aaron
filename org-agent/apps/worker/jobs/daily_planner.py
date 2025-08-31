from core.state import AgentContext
from core.tools import ToolRouter
from adapters.storage_sqlite import Repository, init_db
from core.agent import run_agent

def run() -> None:
	init_db()
	repo = Repository()
	ctx = AgentContext(thread_id="daily", tools=ToolRouter(repo), repo=repo)
	run_agent("Daily review and plan", ctx)
