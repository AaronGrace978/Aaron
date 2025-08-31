from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.cron import CronTrigger
import importlib
from .jobs.cron_specs import JOBS


def _load_callable(path: str):
	mod_path, func_name = path.split(":", 1)
	mod = importlib.import_module(mod_path)
	return getattr(mod, func_name)


def main():
	sched = BlockingScheduler()
	for job in JOBS:
		func = _load_callable(job["func"])
		cron = CronTrigger.from_crontab(job["cron"])
		sched.add_job(func, cron, id=job["id"], replace_existing=True)
	print("Worker started with", len(JOBS), "jobs")
	sched.start()


if __name__ == "__main__":
	main()
