from fastapi import FastAPI
from .routes import chat, tasks, webhooks

app = FastAPI(title="org-agent API")

app.include_router(chat.router)
app.include_router(tasks.router)
app.include_router(webhooks.router)
