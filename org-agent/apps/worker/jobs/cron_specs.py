from typing import List, Dict

JOBS: List[Dict] = [
	{"id": "daily_planner", "cron": "0 8 * * 1-5", "func": "apps.worker.jobs.daily_planner:run"},
	{"id": "followups", "cron": "0 15 * * 1-5", "func": "apps.worker.jobs.ingest_email:run"},
]
