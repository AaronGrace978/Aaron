from __future__ import annotations
import os
from typing import Optional, List, Dict, Any
from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, DateTime, JSON, Text
from sqlalchemy.orm import declarative_base, sessionmaker, Session

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./data/agent.db")
engine = create_engine(DATABASE_URL, echo=False, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
Base = declarative_base()


class KV(Base):
	__tablename__ = "kv"
	id = Column(Integer, primary_key=True)
	namespace = Column(String(64), index=True)
	key = Column(String(256), index=True)
	value = Column(JSON)
	updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Episodic(Base):
	__tablename__ = "episodic_memory"
	id = Column(Integer, primary_key=True)
	thread_id = Column(String(128), index=True)
	summary = Column(Text)
	tags = Column(String(256), default="")
	created_at = Column(DateTime, default=datetime.utcnow)


class TaskRow(Base):
	__tablename__ = "tasks"
	id = Column(Integer, primary_key=True)
	title = Column(String(512))
	status = Column(String(32), index=True, default="NEW")
	priority = Column(Integer, default=0)
	due = Column(String(32), nullable=True)
	meta = Column(JSON)
	created_at = Column(DateTime, default=datetime.utcnow)
	updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


def init_db() -> None:
	Base.metadata.create_all(bind=engine)


class Repository:
	def __init__(self, db: Optional[Session] = None) -> None:
		self.db = db or SessionLocal()

	def upsert_kv(self, namespace: str, key: str, value: Dict[str, Any]) -> None:
		row = self.db.query(KV).filter(KV.namespace == namespace, KV.key == key).one_or_none()
		if row is None:
			row = KV(namespace=namespace, key=key, value=value)
			self.db.add(row)
		else:
			row.value = value
		self.db.commit()

	def get_kv(self, namespace: str, key: str) -> Optional[Dict[str, Any]]:
		row = self.db.query(KV).filter(KV.namespace == namespace, KV.key == key).one_or_none()
		return None if row is None else row.value

	def add_episodic(self, thread_id: str, summary: str, tags: str = "") -> int:
		row = Episodic(thread_id=thread_id, summary=summary, tags=tags)
		self.db.add(row)
		self.db.commit()
		self.db.refresh(row)
		return row.id

	def list_episodic(self, thread_id: str, limit: int = 20) -> List[Dict[str, Any]]:
		rows = (
			self.db.query(Episodic)
			.filter(Episodic.thread_id == thread_id)
			.order_by(Episodic.created_at.desc())
			.limit(limit)
			.all()
		)
		return [
			{"id": r.id, "summary": r.summary, "tags": r.tags, "created_at": r.created_at.isoformat()}
			for r in rows
		]

	def create_task(self, title: str, status: str = "NEW", priority: int = 0, due: Optional[str] = None, meta: Optional[Dict[str, Any]] = None) -> int:
		row = TaskRow(title=title, status=status, priority=priority, due=due, meta=meta or {})
		self.db.add(row)
		self.db.commit()
		self.db.refresh(row)
		return row.id

	def list_tasks(self, status: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
		q = self.db.query(TaskRow)
		if status:
			q = q.filter(TaskRow.status == status)
		rows = q.order_by(TaskRow.priority.desc(), TaskRow.created_at.asc()).limit(limit).all()
		return [
			{"id": r.id, "title": r.title, "status": r.status, "priority": r.priority, "due": r.due, "meta": r.meta}
			for r in rows
		]

	def update_task(self, task_id: int, **fields: Any) -> None:
		row = self.db.query(TaskRow).filter(TaskRow.id == task_id).one()
		for k, v in fields.items():
			setattr(row, k, v)
		self.db.commit()
