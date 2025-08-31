from core.tools import ToolRouter
from adapters.storage_sqlite import Repository, init_db

def test_list_tasks_empty(tmp_path):
	init_db()
	repo = Repository()
	router = ToolRouter(repo)
	res = router.call("list_tasks", {"limit": 5})
	assert isinstance(res, list)
