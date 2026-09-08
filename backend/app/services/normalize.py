from __future__ import annotations

import re
from typing import Any

from app.models.schemas import (
    DeviceType,
    HealthState,
    HostInterface,
    HostNode,
    LiveStats,
    MetricSnapshot,
    ProblemSummary,
)


# Heuristic keywords — generic, not lab-specific hostnames
_TYPE_RULES: list[tuple[DeviceType, list[str]]] = [
    (DeviceType.firewall, ["firewall", "fw-", "palo", "fortigate", "asa", "checkpoint", "sophos"]),
    (DeviceType.router, ["router", "rtr", "gateway", "edge"]),
    (DeviceType.switch, ["switch", "sw-", "catalyst", "nexus", "procurve", "aruba"]),
    (DeviceType.printer, ["printer", "print", "laserjet", "mfp"]),
    (DeviceType.vm, ["vmware", "hyper-v", "virtual", "kvm", "proxmox", "vm-"]),
    (DeviceType.server, ["server", "srv", "linux", "windows server", "db-", "sql", "web-"]),
    (DeviceType.workstation, ["workstation", "desktop", "laptop", "pc-", "notebook"]),
    (DeviceType.network, ["network", "ap-", "access point", "wifi", "wlc", "nas"]),
]


def _haystack(host: dict[str, Any]) -> str:
    parts: list[str] = [
        str(host.get("name") or ""),
        str(host.get("host") or ""),
        str(host.get("description") or ""),
    ]
    for g in host.get("groups") or []:
        parts.append(str(g.get("name") or ""))
    for t in host.get("parentTemplates") or []:
        parts.append(str(t.get("name") or ""))
    for tag in host.get("tags") or []:
        parts.append(f"{tag.get('tag', '')}:{tag.get('value', '')}")
    return " ".join(parts).lower()


def infer_device_type(host: dict[str, Any]) -> DeviceType:
    text = _haystack(host)
    for device_type, keywords in _TYPE_RULES:
        for kw in keywords:
            if kw in text:
                return device_type
    # SNMP interface often indicates network gear
    interfaces = host.get("interfaces") or []
    snmp_only = interfaces and all(int(i.get("type", 0)) == 2 for i in interfaces)
    if snmp_only:
        return DeviceType.network
    return DeviceType.other


def severity_to_health(severity: int) -> HealthState:
    # Zabbix: 0 not classified … 5 disaster
    if severity >= 4:
        return HealthState.critical
    if severity >= 2:
        return HealthState.warning
    return HealthState.ok


def compute_host_health(
    *,
    available: int | None,
    status: int,
    problems: list[ProblemSummary],
) -> HealthState:
    if status == 1:
        return HealthState.unknown
    if available == 2:
        return HealthState.unavailable
    if problems:
        worst = max(p.severity for p in problems)
        return severity_to_health(worst)
    if available == 1:
        return HealthState.ok
    if available == 0 or available is None:
        # No agent availability signal — still OK if no problems
        return HealthState.ok if not problems else HealthState.warning
    return HealthState.unknown


def primary_ip(interfaces: list[dict[str, Any]]) -> str | None:
    if not interfaces:
        return None
    mains = [i for i in interfaces if str(i.get("main")) in ("1", "true", "True", True)]
    ordered = mains or interfaces
    for iface in ordered:
        ip = (iface.get("ip") or "").strip()
        if ip and ip != "127.0.0.1":
            return ip
    for iface in ordered:
        dns = (iface.get("dns") or "").strip()
        if dns:
            return dns
    return None


def normalize_host(
    raw: dict[str, Any],
    problems_by_host: dict[str, list[ProblemSummary]],
    metrics_by_host: dict[str, list[MetricSnapshot]] | None = None,
    live_by_host: dict[str, LiveStats] | None = None,
) -> HostNode:
    hostid = str(raw["hostid"])
    interfaces_raw = raw.get("interfaces") or []
    interfaces = [
        HostInterface(
            interfaceid=str(i.get("interfaceid")),
            hostid=hostid,
            ip=i.get("ip") or None,
            dns=i.get("dns") or None,
            port=str(i.get("port")) if i.get("port") is not None else None,
            type=int(i["type"]) if i.get("type") is not None else None,
            main=str(i.get("main")) in ("1", "true", "True"),
            available=int(i["available"]) if i.get("available") is not None else None,
            name=None,
        )
        for i in interfaces_raw
    ]
    problems = problems_by_host.get(hostid, [])
    available = raw.get("available")
    if available is not None:
        available = int(available)
    else:
        main_avails = [i.available for i in interfaces if i.main and i.available is not None]
        available = main_avails[0] if main_avails else None

    status = int(raw.get("status", 0))
    return HostNode(
        hostid=hostid,
        name=str(raw.get("name") or raw.get("host") or hostid),
        host=str(raw.get("host") or ""),
        status=status,
        available=available,
        ip=primary_ip(interfaces_raw),
        device_type=infer_device_type(raw),
        health=compute_host_health(available=available, status=status, problems=problems),
        groups=[str(g.get("name")) for g in (raw.get("groups") or []) if g.get("name")],
        templates=[str(t.get("name")) for t in (raw.get("parentTemplates") or []) if t.get("name")],
        interfaces=interfaces,
        problems=problems,
        metrics=(metrics_by_host or {}).get(hostid, []),
        live=(live_by_host or {}).get(hostid, LiveStats()),
        description=raw.get("description") or None,
    )


INTERFACE_TYPE_LABEL = {1: "Agent", 2: "SNMP", 3: "IPMI", 4: "JMX"}

# Item key patterns useful for topology / bandwidth (generic)
METRIC_KEY_PATTERNS = [
    re.compile(r"net\.if\.(in|out|errors|dropped|speed|status)", re.I),
    re.compile(r"if(HC)?(In|Out)(Octets|Errors|Discards)", re.I),
    re.compile(r"system\.(cpu|memory|swap|uptime)", re.I),
    re.compile(r"vm\.memory", re.I),
    re.compile(r"vfs\.fs", re.I),
    re.compile(r"icmpping", re.I),
    re.compile(r"lldp|cdp|neighbor", re.I),
]


def is_interesting_item(key: str) -> bool:
    return any(p.search(key) for p in METRIC_KEY_PATTERNS)
