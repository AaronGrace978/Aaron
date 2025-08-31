import argparse
from core.state import AgentContext
from core.tools import ToolRouter
from adapters.storage_sqlite import Repository, init_db
from core.agent import run_agent


def main():
	parser = argparse.ArgumentParser(prog="orgctl")
	sub = parser.add_subparsers(dest="cmd")
	p_plan = sub.add_parser("plan")
	p_plan.add_argument("--today", action="store_true")
	p_plan.add_argument("--text", type=str, default="Plan my day")
	args = parser.parse_args()

	init_db()
	repo = Repository()
	ctx = AgentContext(thread_id="cli", tools=ToolRouter(repo), repo=repo)

	if args.cmd == "plan":
		msg = args.text if not args.today else "Plan my day today"
		plan, summary = run_agent(msg, ctx)
		print(summary)
		print(plan)


if __name__ == "__main__":
	main()
