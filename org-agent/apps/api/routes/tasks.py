from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from ..deps import get_ctx

router = APIRouter(prefix="/tasks")


class CreateTaskIn(BaseModel):
	title: str
	priority: int = 0
	due: Optional[str] = None
	meta: Optional[dict] = None


class UpdateTaskIn(BaseModel):
	id: int
	fields: dict


@router.get("")
async def list_tasks(status: Optional[str] = None, limit: int = 50):
	ctx = get_ctx()
	return ctx.repo.list_tasks(status=status, limit=limit)


@router.post("")
async def create_task(inp: CreateTaskIn):
	ctx = get_ctx()
	task_id = ctx.repo.create_task(inp.title, priority=inp.priority, due=inp.due, meta=inp.meta)
	return {"id": task_id}


@router.post("/update")
async def update_task(inp: UpdateTaskIn):
	ctx = get_ctx()
	ctx.repo.update_task(inp.id, **inp.fields)
	return {"ok": True}
