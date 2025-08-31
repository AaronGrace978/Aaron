from adapters.storage_sqlite import Repository, init_db
from core.tools import ToolRouter
from core.state import AgentContext


def get_ctx(thread_id: str = "default") -> AgentContext:
	init_db()
	repo = Repository()
	tools = ToolRouter(repo)
	return AgentContext(thread_id=thread_id, tools=tools, repo=repo)
