from fastapi import APIRouter
from pydantic import BaseModel
from core.agent import run_agent
from ..deps import get_ctx

router = APIRouter()


class ChatIn(BaseModel):
	message: str
	thread_id: str | None = None


@router.post("/chat")
async def chat_endpoint(inp: ChatIn):
	ctx = get_ctx(inp.thread_id or "default")
	plan, summary = run_agent(inp.message, ctx)
	return {"summary": summary, "plan": plan}
