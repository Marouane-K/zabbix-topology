from __future__ import annotations

from fastapi import APIRouter, Header, HTTPException

from app.models.schemas import (
    ConnectRequest,
    ConnectResponse,
    LayoutPayload,
    ThresholdConfig,
)
from app.services.demo import build_demo_topology
from app.services.inventory import diff_graphs, fetch_topology
from app.services.sessions import sessions
from app.storage import db as store
from app.zabbix.client import ZabbixAPIError, ZabbixClient

router = APIRouter(prefix="/api")


def _require_session(x_session_id: str | None):
    if not x_session_id:
        raise HTTPException(status_code=401, detail="Session requise (en-tête X-Session-Id)")
    session = sessions.get(x_session_id)
    if not session:
        raise HTTPException(status_code=401, detail="Session invalide ou expirée")
    return session


@router.get("/health")
async def health():
    return {"status": "ok", "service": "zabbix-topology"}


@router.post("/connect", response_model=ConnectResponse)
async def connect(body: ConnectRequest):
    url = body.url.strip()
    if not url:
        raise HTTPException(status_code=400, detail="URL Zabbix requise")

    client = ZabbixClient(url, verify_ssl=body.verify_ssl)
    try:
        version = await client.version()
    except ZabbixAPIError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    auth: str | None = None
    if body.auth_method.value == "token":
        if not body.token:
            raise HTTPException(status_code=400, detail="Token API requis")
        auth = body.token.strip()
        try:
            auth = await client.login_with_token(auth)
        except ZabbixAPIError as exc:
            raise HTTPException(status_code=401, detail=f"Authentification refusée: {exc}") from exc
    else:
        if not body.username or not body.password:
            raise HTTPException(status_code=400, detail="Identifiant et mot de passe requis")
        try:
            auth = await client.login_legacy(body.username, body.password)
        except ZabbixAPIError as exc:
            raise HTTPException(status_code=401, detail=f"Authentification refusée: {exc}") from exc

    session = sessions.create(
        url=client.url,
        auth=auth,
        verify_ssl=body.verify_ssl,
        zabbix_version=version,
        is_demo=False,
    )
    return ConnectResponse(
        session_id=session.session_id,
        zabbix_version=version,
        message=f"Connecté à Zabbix {version}",
    )


@router.post("/demo", response_model=ConnectResponse)
async def connect_demo():
    session = sessions.create(
        url="demo://local",
        auth=None,
        verify_ssl=True,
        zabbix_version="demo",
        is_demo=True,
    )
    return ConnectResponse(
        session_id=session.session_id,
        zabbix_version="demo",
        message="Mode démonstration chargé (données fictives)",
    )


@router.post("/disconnect")
async def disconnect(x_session_id: str | None = Header(default=None)):
    session = _require_session(x_session_id)
    if not session.is_demo and session.auth:
        try:
            await session.client().logout()
        except ZabbixAPIError:
            pass
    sessions.delete(session.session_id)
    return {"ok": True}


@router.get("/topology")
async def get_topology(x_session_id: str | None = Header(default=None)):
    session = _require_session(x_session_id)
    previous = session.last_graph
    try:
        graph = await fetch_topology(session)
    except ZabbixAPIError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    diff = diff_graphs(previous, graph)
    return {"graph": graph, "diff": diff}


@router.get("/hosts/{hostid}")
async def get_host_detail(hostid: str, x_session_id: str | None = Header(default=None)):
    session = _require_session(x_session_id)
    try:
        graph = await fetch_topology(session)
    except ZabbixAPIError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    host = next((h for h in graph.hosts if h.hostid == hostid), None)
    if not host:
        raise HTTPException(status_code=404, detail="Équipement introuvable")
    related = [l for l in graph.links if l.source_hostid == hostid or l.target_hostid == hostid]
    return {"host": host, "links": related}


@router.get("/layout")
async def get_layout(x_session_id: str | None = Header(default=None)):
    session = _require_session(x_session_id)
    layout = await store.load_layout(session.url, "default")
    prefs = await store.load_preferences(session.url)
    return {"layout": layout, "preferences": prefs}


@router.put("/layout")
async def put_layout(body: LayoutPayload, x_session_id: str | None = Header(default=None)):
    session = _require_session(x_session_id)
    payload = body.model_dump()
    await store.save_layout(session.url, "default", payload)
    if body.preferences:
        await store.save_preferences(session.url, body.preferences)
    return {"ok": True}


@router.get("/preferences")
async def get_preferences(x_session_id: str | None = Header(default=None)):
    session = _require_session(x_session_id)
    return await store.load_preferences(session.url)


@router.put("/preferences")
async def put_preferences(body: dict, x_session_id: str | None = Header(default=None)):
    session = _require_session(x_session_id)
    await store.save_preferences(session.url, body)
    return {"ok": True}


@router.get("/thresholds")
async def get_thresholds(x_session_id: str | None = Header(default=None)):
    session = _require_session(x_session_id)
    prefs = await store.load_preferences(session.url)
    t = prefs.get("thresholds") or {}
    return ThresholdConfig(
        normal_max=float(t.get("normal_max", 60)),
        high_max=float(t.get("high_max", 80)),
        warning_max=float(t.get("warning_max", 90)),
    )


@router.get("/history/{itemid}")
async def get_history(
    itemid: str,
    hours: float = 1.0,
    value_type: int = 3,
    x_session_id: str | None = Header(default=None),
):
    session = _require_session(x_session_id)
    if session.is_demo:
        import math
        import time

        now = int(time.time())
        points = []
        for i in range(60):
            clock = now - (60 - i) * int(hours * 60)
            points.append({"clock": clock, "value": 40 + 20 * math.sin(i / 5) + (i % 7)})
        return {"itemid": itemid, "name": "Demo series", "units": "bps", "points": points}

    import time

    time_till = int(time.time())
    time_from = time_till - int(hours * 3600)
    try:
        rows = await session.client().get_history(itemid, value_type, time_from, time_till)
    except ZabbixAPIError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    points = [{"clock": int(r["clock"]), "value": float(r["value"])} for r in rows or []]
    return {"itemid": itemid, "name": itemid, "units": None, "points": points}


@router.get("/demo/preview")
async def demo_preview():
    return build_demo_topology()
