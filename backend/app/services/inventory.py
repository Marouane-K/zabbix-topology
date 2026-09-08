from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from app.models.schemas import (
    LiveStats,
    MetricSnapshot,
    ProblemSummary,
    TopologyDiff,
    TopologyGraph,
)
from app.services.demo import build_demo_topology
from app.services.metrics import extract_live_stats, items_to_snapshots
from app.services.normalize import is_interesting_item, normalize_host
from app.services.sessions import Session
from app.services.topology import (
    build_links_from_adjacent_interfaces,
    build_links_from_maps,
    build_links_from_neighbor_items,
    build_links_from_subnets,
    enrich_links_with_traffic,
    merge_links,
)
from app.zabbix.client import ZabbixAPIError


async def fetch_topology(session: Session) -> TopologyGraph:
    if session.is_demo:
        graph = build_demo_topology()
        session.last_graph = graph.model_dump()
        return graph

    client = session.client()
    raw_hosts = await client.get_hosts()
    hostids = [str(h["hostid"]) for h in raw_hosts]

    events_by_host: dict[str, list[ProblemSummary]] = {hid: [] for hid in hostids}
    try:
        triggers = await client.call(
            "trigger.get",
            {
                "output": ["triggerid", "description", "priority", "value", "lastchange"],
                "hostids": hostids,
                "filter": {"value": 1},
                "monitored": True,
                "selectHosts": ["hostid"],
                "limit": 500,
            },
        )
        for tr in triggers or []:
            for h in tr.get("hosts") or []:
                hid = str(h.get("hostid"))
                if hid in events_by_host:
                    events_by_host[hid].append(
                        ProblemSummary(
                            eventid=str(tr.get("triggerid")),
                            name=str(tr.get("description") or "Problem"),
                            severity=int(tr.get("priority") or 0),
                            clock=int(tr["lastchange"]) if tr.get("lastchange") else None,
                        )
                    )
    except ZabbixAPIError:
        pass

    items_by_host: dict[str, list[dict[str, Any]]] = {hid: [] for hid in hostids}
    metrics_by_host: dict[str, list[MetricSnapshot]] = {hid: [] for hid in hostids}
    live_by_host: dict[str, LiveStats] = {hid: LiveStats() for hid in hostids}
    all_items: list[dict[str, Any]] = []

    if hostids:
        try:
            all_items = await client.call(
                "item.get",
                {
                    "output": [
                        "itemid",
                        "hostid",
                        "name",
                        "key_",
                        "lastvalue",
                        "units",
                        "value_type",
                        "status",
                    ],
                    "hostids": hostids,
                    "filter": {"status": 0},
                    "monitored": True,
                    "limit": 10000,
                },
            ) or []
            for item in all_items:
                hid = str(item.get("hostid"))
                if hid not in items_by_host:
                    continue
                items_by_host[hid].append(item)

            for hid, host_items in items_by_host.items():
                live_by_host[hid] = extract_live_stats(host_items)
                interesting = [i for i in host_items if is_interesting_item(str(i.get("key_") or ""))]
                metrics_by_host[hid] = items_to_snapshots(interesting, limit=50)
        except ZabbixAPIError:
            all_items = []

    hosts = [
        normalize_host(h, events_by_host, metrics_by_host, live_by_host) for h in raw_hosts
    ]
    valid = {h.hostid for h in hosts}
    host_by_name: dict[str, str] = {}
    for h in hosts:
        host_by_name[h.name] = h.hostid
        host_by_name[h.host] = h.hostid

    maps: list[dict[str, Any]] = []
    try:
        maps = await client.get_maps()
    except ZabbixAPIError:
        maps = []

    map_links = build_links_from_maps(maps, valid, hosts)
    neighbor_links = build_links_from_neighbor_items(all_items, host_by_name, valid)
    adjacent_links = build_links_from_adjacent_interfaces(hosts)
    subnet_links = build_links_from_subnets(hosts)
    links = merge_links(map_links, neighbor_links, adjacent_links, subnet_links)
    links = enrich_links_with_traffic(links, items_by_host)

    graph = TopologyGraph(
        hosts=hosts,
        links=links,
        generated_at=datetime.now(timezone.utc).isoformat(),
        zabbix_version=session.zabbix_version,
    )
    session.last_graph = graph.model_dump()
    return graph


def diff_graphs(previous: dict[str, Any] | None, current: TopologyGraph) -> TopologyDiff:
    if not previous:
        return TopologyDiff(added_hosts=[h.hostid for h in current.hosts])

    prev_hosts = {h["hostid"] for h in previous.get("hosts", [])}
    curr_hosts = {h.hostid for h in current.hosts}
    prev_links = {l["id"] for l in previous.get("links", [])}
    curr_links = {l.id for l in current.links}

    prev_health = {h["hostid"]: h.get("health") for h in previous.get("hosts", [])}
    health_changes = []
    for h in current.hosts:
        if h.hostid in prev_health and prev_health[h.hostid] != h.health.value:
            health_changes.append(
                {"hostid": h.hostid, "from": prev_health[h.hostid], "to": h.health.value}
            )

    prev_problems = sum(len(h.get("problems") or []) for h in previous.get("hosts", []))
    curr_problems = sum(len(h.problems) for h in current.hosts)

    return TopologyDiff(
        added_hosts=sorted(curr_hosts - prev_hosts),
        removed_hosts=sorted(prev_hosts - curr_hosts),
        added_links=sorted(curr_links - prev_links),
        removed_links=sorted(prev_links - curr_links),
        health_changes=health_changes,
        new_problems=max(0, curr_problems - prev_problems),
        resolved_problems=max(0, prev_problems - curr_problems),
    )
