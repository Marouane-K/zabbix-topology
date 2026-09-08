from __future__ import annotations

import secrets
import time
from dataclasses import dataclass, field
from typing import Any

from app.zabbix.client import ZabbixClient


@dataclass
class Session:
    session_id: str
    url: str
    auth: str | None
    verify_ssl: bool
    zabbix_version: str
    created_at: float = field(default_factory=time.time)
    last_graph: dict[str, Any] | None = None
    is_demo: bool = False

    def client(self) -> ZabbixClient:
        return ZabbixClient(
            self.url,
            auth=self.auth,
            verify_ssl=self.verify_ssl,
            api_version=self.zabbix_version,
        )


class SessionStore:
    def __init__(self) -> None:
        self._sessions: dict[str, Session] = {}

    def create(
        self,
        *,
        url: str,
        auth: str | None,
        verify_ssl: bool,
        zabbix_version: str,
        is_demo: bool = False,
    ) -> Session:
        sid = secrets.token_urlsafe(24)
        session = Session(
            session_id=sid,
            url=url,
            auth=auth,
            verify_ssl=verify_ssl,
            zabbix_version=zabbix_version,
            is_demo=is_demo,
        )
        self._sessions[sid] = session
        return session

    def get(self, session_id: str) -> Session | None:
        return self._sessions.get(session_id)

    def delete(self, session_id: str) -> None:
        self._sessions.pop(session_id, None)


sessions = SessionStore()
