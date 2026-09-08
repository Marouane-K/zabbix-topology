from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import aiosqlite

from app.config import get_settings


SCHEMA = """
CREATE TABLE IF NOT EXISTS layouts (
    session_key TEXT NOT NULL,
    zabbix_url TEXT NOT NULL,
    payload TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (session_key, zabbix_url)
);

CREATE TABLE IF NOT EXISTS preferences (
    zabbix_url TEXT PRIMARY KEY,
    payload TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS manual_links (
    zabbix_url TEXT NOT NULL,
    link_id TEXT NOT NULL,
    payload TEXT NOT NULL,
    PRIMARY KEY (zabbix_url, link_id)
);
"""


async def init_db() -> None:
    settings = get_settings()
    path = settings.db_path
    path.parent.mkdir(parents=True, exist_ok=True)
    async with aiosqlite.connect(path) as db:
        await db.executescript(SCHEMA)
        await db.commit()


def _db() -> Path:
    return get_settings().db_path


async def save_layout(zabbix_url: str, session_key: str, payload: dict[str, Any]) -> None:
    from datetime import datetime, timezone

    async with aiosqlite.connect(_db()) as db:
        await db.execute(
            """
            INSERT INTO layouts (session_key, zabbix_url, payload, updated_at)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(session_key, zabbix_url) DO UPDATE SET
                payload=excluded.payload,
                updated_at=excluded.updated_at
            """,
            (session_key, zabbix_url, json.dumps(payload), datetime.now(timezone.utc).isoformat()),
        )
        await db.commit()


async def load_layout(zabbix_url: str, session_key: str) -> dict[str, Any] | None:
    async with aiosqlite.connect(_db()) as db:
        cursor = await db.execute(
            "SELECT payload FROM layouts WHERE session_key=? AND zabbix_url=?",
            (session_key, zabbix_url),
        )
        row = await cursor.fetchone()
        if not row:
            return None
        return json.loads(row[0])


async def save_preferences(zabbix_url: str, payload: dict[str, Any]) -> None:
    from datetime import datetime, timezone

    async with aiosqlite.connect(_db()) as db:
        await db.execute(
            """
            INSERT INTO preferences (zabbix_url, payload, updated_at)
            VALUES (?, ?, ?)
            ON CONFLICT(zabbix_url) DO UPDATE SET
                payload=excluded.payload,
                updated_at=excluded.updated_at
            """,
            (zabbix_url, json.dumps(payload), datetime.now(timezone.utc).isoformat()),
        )
        await db.commit()


async def load_preferences(zabbix_url: str) -> dict[str, Any]:
    async with aiosqlite.connect(_db()) as db:
        cursor = await db.execute(
            "SELECT payload FROM preferences WHERE zabbix_url=?",
            (zabbix_url,),
        )
        row = await cursor.fetchone()
        if not row:
            return {
                "thresholds": {"normal_max": 60, "high_max": 80, "warning_max": 90},
                "display_mode": "supervision",
                "show_traffic": True,
                "show_ips": True,
                "show_labels": True,
            }
        return json.loads(row[0])
