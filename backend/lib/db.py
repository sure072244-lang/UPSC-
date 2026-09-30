"""Shared Mongo handle — import `client`/`db` from here (server.py, routers, seed.py)."""

import logging
import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import HTTPException
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ASCENDING, DESCENDING, IndexModel

load_dotenv(Path(__file__).parent.parent / ".env")

mongo_url = os.environ.get("MONGO_URL", "").strip()
database_name = os.environ.get("DB_NAME", "").strip()
mongo_configured = bool(mongo_url and database_name)


class _UnavailableDatabase:
    def __getattr__(self, collection: str):
        raise HTTPException(
            status_code=503,
            detail="MongoDB is not configured. Set MONGO_URL and DB_NAME in the deployment environment.",
        )

    def __getitem__(self, collection: str):
        return self.__getattr__(collection)


class _UnavailableClient:
    def close(self) -> None:
        return None


if mongo_configured:
    client = AsyncIOMotorClient(
        mongo_url,
        serverSelectionTimeoutMS=5000,
        connectTimeoutMS=5000,
    )
    db = client[database_name]
else:
    client = _UnavailableClient()
    db = _UnavailableDatabase()
    logger = logging.getLogger(__name__)
    logger.warning("MongoDB not configured; database-backed routes will return HTTP 503")

logger = logging.getLogger(__name__)

# One entry per collection: every field a route filters, sorts, or dedupes on. Applied by ensure_indexes() at startup.
INDEXES: dict[str, list[IndexModel]] = {
    "status_checks": [IndexModel([("timestamp", DESCENDING)], name="timestamp_desc")],
    "subjects": [
        IndexModel([("id", ASCENDING)], name="id", unique=True),
        IndexModel([("name", ASCENDING)], name="name_asc"),
    ],
    "sessions": [
        IndexModel([("id", ASCENDING)], name="id", unique=True),
        IndexModel([("date", DESCENDING), ("created_at", DESCENDING)], name="date_created_desc"),
        IndexModel([("subject_id", ASCENDING)], name="subject_id_asc"),
    ],
    "goals": [
        IndexModel([("id", ASCENDING)], name="id", unique=True),
        IndexModel([("status", ASCENDING), ("target_date", ASCENDING)], name="status_target"),
    ],
    "revisions": [
        IndexModel([("id", ASCENDING)], name="id", unique=True),
        IndexModel([("next_due", ASCENDING)], name="next_due_asc"),
    ],
    "tests": [
        IndexModel([("id", ASCENDING)], name="id", unique=True),
        IndexModel([("date", DESCENDING)], name="date_desc"),
    ],
    "notion_logs": [IndexModel([("created_at", DESCENDING)], name="created_desc")],
    "notion_mirror": [IndexModel([("created_at", DESCENDING)], name="created_desc")],
    "notion_entries": [
        IndexModel([("page_id", ASCENDING)], name="page_id", unique=True),
        IndexModel([("last_edited_time", DESCENDING)], name="edited_desc"),
        IndexModel([("unread", ASCENDING)], name="unread_asc"),
        IndexModel([("place_type", ASCENDING)], name="place_type_asc"),
        IndexModel([("priority", ASCENDING)], name="priority_asc"),
    ],
    "pyq_attempts": [
        IndexModel([("id", ASCENDING)], name="id", unique=True),
        IndexModel([("created_at", DESCENDING)], name="created_desc"),
    ],
    "ai_messages": [
        IndexModel([("session_id", ASCENDING), ("created_at", ASCENDING)], name="session_created"),
    ],
    "ai_sessions": [
        IndexModel([("id", ASCENDING)], name="id", unique=True),
        IndexModel([("updated_at", DESCENDING)], name="updated_desc"),
    ],
    "omr_runs": [IndexModel([("date", DESCENDING)], name="date_desc")],
    "devices": [IndexModel([("id", ASCENDING)], name="id", unique=True)],
    "app_meta": [IndexModel([("key", ASCENDING)], name="key", unique=True)],
    "passkey_challenges": [
        IndexModel([("expires_at", ASCENDING)], name="expires_at_ttl", expireAfterSeconds=0)
    ],
    "passkey_sessions": [
        IndexModel([("expires_at", ASCENDING)], name="expires_at_ttl", expireAfterSeconds=0)
    ],
}


async def ensure_indexes() -> None:
    if not mongo_configured:
        return
    for collection, models in INDEXES.items():
        for model in models:  # one at a time so a bad spec skips only itself
            try:
                await db[collection].create_indexes([model])
            except Exception as exc:  # never block boot on an index; the log line names what to fix
                logger.error("ensure_indexes(%s.%s): %s", collection, model.document["name"], exc)
