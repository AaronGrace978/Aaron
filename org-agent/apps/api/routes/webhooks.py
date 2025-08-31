from fastapi import APIRouter

router = APIRouter(prefix="/webhooks")


@router.post("/inbox")
async def inbox_hook(payload: dict):
	# Minimal stub: accept payload and return ok
	return {"ok": True}
