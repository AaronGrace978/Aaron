from adapters.storage_sqlite import Repository, init_db
from core.memory import ShortMemory, EpisodicMemory
from core.state import AgentContext


def test_short_and_episodic_memory():
	init_db()
	repo = Repository()
	ctx = AgentContext(thread_id="t1", tools=None, repo=repo)
	ShortMemory.save("t1", [{"k": "v"}], ctx)
	loaded = ShortMemory.load("t1", ctx)
	assert loaded and loaded[0]["k"] == "v"
	id_ = EpisodicMemory.save("t1", "summary", ctx)
	assert id_ > 0
	rows = EpisodicMemory.list("t1", ctx)
	assert isinstance(rows, list)
