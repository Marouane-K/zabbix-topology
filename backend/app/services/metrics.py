from __future__ import annotations

import re
from typing import Any

from app.models.schemas import LiveStats, MetricSnapshot


_CPU = re.compile(r"^system\.cpu\.util(?:\[?\])?$", re.I)
_CPU_SNMP = re.compile(r"system\.cpu\.util|ssCpuRawIdle|hrProcessorLoad", re.I)
_MEM = re.compile(r"^vm\.memory\.util|memory\.util|hrStorageUsed", re.I)
_MEM_PAVAIL = re.compile(r"vm\.memory\.size\[pavailable\]", re.I)
_DISK = re.compile(r"vfs\.fs(?:\.dependent)?\.size\[/,pused\]", re.I)
_NET_IN = re.compile(r'net\.if\.in(?:\["[^"]+"\])?(?:\[ifHCInOctets\.\d+\])?$', re.I)
_NET_IN2 = re.compile(r"net\.if\.in\[ifHCInOctets", re.I)
_NET_OUT = re.compile(r'net\.if\.out(?:\["[^"]+"\])?(?:\[ifHCOutOctets\.\d+\])?$', re.I)
_NET_OUT2 = re.compile(r"net\.if\.out\[ifHCOutOctets", re.I)
_ICMP_LOSS = re.compile(r"^icmppingloss$", re.I)
_ICMP_PING = re.compile(r"^icmpping\[|icmppingsec", re.I)
_UPTIME = re.compile(r"^system\.uptime$", re.I)
_IF_SPEED = re.compile(r"net\.if\.speed|ifHighSpeed|/speed", re.I)


def _f(value: Any) -> float | None:
    if value is None or value == "":
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def extract_live_stats(items: list[dict[str, Any]]) -> LiveStats:
    cpu = None
    mem = None
    disk = None
    net_in_total = 0.0
    net_out_total = 0.0
    has_net_in = False
    has_net_out = False
    icmp_loss = None
    icmp_ping_sec = None
    uptime = None

    for item in items:
        key = str(item.get("key_") or "")
        val = _f(item.get("lastvalue"))
        if val is None:
            continue

        if _CPU.match(key) or key == "system.cpu.util":
            cpu = val
        elif "ssCpuRawIdle" in key and cpu is None:
            # idle % → util approx
            cpu = max(0.0, 100.0 - val) if val <= 100 else None
        elif _MEM.match(key):
            mem = val
        elif _MEM_PAVAIL.match(key) and mem is None:
            mem = max(0.0, 100.0 - val)
        elif _DISK.match(key):
            disk = val
        elif _NET_IN.match(key) or _NET_IN2.search(key):
            # skip error/dropped variants
            if "error" in key.lower() or "drop" in key.lower() or "discard" in key.lower():
                continue
            net_in_total += val
            has_net_in = True
        elif _NET_OUT.match(key) or _NET_OUT2.search(key):
            if "error" in key.lower() or "drop" in key.lower() or "discard" in key.lower():
                continue
            net_out_total += val
            has_net_out = True
        elif _ICMP_LOSS.match(key):
            icmp_loss = val
        elif _ICMP_PING.match(key):
            # icmppingsec stores response time in seconds
            icmp_ping_sec = val
        elif _UPTIME.match(key):
            uptime = val

    return LiveStats(
        cpu_pct=round(cpu, 1) if cpu is not None else None,
        mem_pct=round(mem, 1) if mem is not None else None,
        disk_pct=round(disk, 1) if disk is not None else None,
        net_in_bps=net_in_total if has_net_in else None,
        net_out_bps=net_out_total if has_net_out else None,
        icmp_loss_pct=icmp_loss,
        icmp_latency_sec=icmp_ping_sec,
        uptime_sec=uptime,
    )


def items_to_snapshots(items: list[dict[str, Any]], limit: int = 40) -> list[MetricSnapshot]:
    out: list[MetricSnapshot] = []
    for item in items:
        if len(out) >= limit:
            break
        key = str(item.get("key_") or "")
        out.append(
            MetricSnapshot(
                key=key,
                name=str(item.get("name") or key),
                value=str(item.get("lastvalue")) if item.get("lastvalue") is not None else None,
                units=item.get("units") or None,
                itemid=str(item.get("itemid")) if item.get("itemid") else None,
            )
        )
    return out


def pick_primary_traffic_items(items: list[dict[str, Any]]) -> dict[str, Any]:
    """Pick best in/out/speed items for link enrichment."""
    best: dict[str, Any] = {"in": None, "out": None, "speed": None, "in_val": 0.0, "out_val": 0.0}
    for item in items:
        key = str(item.get("key_") or "")
        val = _f(item.get("lastvalue"))
        if val is None:
            continue
        low = key.lower()
        if "error" in low or "drop" in low or "discard" in low:
            continue
        if (_NET_IN.match(key) or _NET_IN2.search(key)) and val >= best["in_val"]:
            best["in"] = item
            best["in_val"] = val
        if (_NET_OUT.match(key) or _NET_OUT2.search(key)) and val >= best["out_val"]:
            best["out"] = item
            best["out_val"] = val
        if _IF_SPEED.search(key) and val > 0:
            # ifHighSpeed is in Mbps in SNMP; Linux agent speed may already be bps
            speed = val
            if "ifHighSpeed" in key or "net.if.speed" in key:
                # Zabbix Linux by SNMP template stores bps already in lastvalue units
                if item.get("units") == "bps":
                    speed = val
                elif val < 1_000_000:
                    speed = val * 1_000_000  # Mbps → bps heuristic
            best["speed"] = speed
    return best
