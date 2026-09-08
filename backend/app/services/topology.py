from __future__ import annotations

import hashlib
import ipaddress
import re
from typing import Any

from app.models.schemas import DeviceType, HostNode, LinkState, TopologyLink
from app.services.metrics import pick_primary_traffic_items


# Neighbor / LLDP / CDP discovery — evidence-based only
_NEIGHBOR_PATTERNS = [
    re.compile(r"lldp\.|lldpLoc|lldpRem", re.I),
    re.compile(r"cdp\.|cdpCache", re.I),
    re.compile(r"neighbor", re.I),
]


def _link_id(a: str, b: str, src_if: str | None = None, dst_if: str | None = None) -> str:
    left, right = sorted([a, b])
    raw = f"{left}|{right}|{src_if or ''}|{dst_if or ''}"
    return hashlib.sha1(raw.encode()).hexdigest()[:16]


def build_links_from_maps(
    maps: list[dict[str, Any]],
    valid_hostids: set[str],
    hosts: list[HostNode] | None = None,
) -> list[TopologyLink]:
    """Extract host-to-host links from Zabbix network maps when present."""
    links: list[TopologyLink] = []
    seen: set[str] = set()
    hosts = hosts or []
    name_index = _host_name_index(hosts)

    for sysmap in maps:
        elements = {str(e.get("selementid")): e for e in (sysmap.get("selements") or [])}
        for link in sysmap.get("links") or []:
            se1 = elements.get(str(link.get("selementid1")))
            se2 = elements.get(str(link.get("selementid2")))
            if not se1 or not se2:
                continue
            h1 = _resolve_map_element(se1, valid_hostids, name_index)
            h2 = _resolve_map_element(se2, valid_hostids, name_index)
            if not h1 or not h2 or h1 == h2:
                continue
            lid = _link_id(h1, h2)
            if lid in seen:
                continue
            seen.add(lid)
            links.append(
                TopologyLink(
                    id=lid,
                    source_hostid=h1,
                    target_hostid=h2,
                    link_type="zabbix_map",
                    evidence=f"Carte Zabbix: {sysmap.get('name', 'map')}",
                    state=LinkState.normal,
                    manual=False,
                )
            )
    return links


def _host_name_index(hosts: list[HostNode]) -> dict[str, str]:
    idx: dict[str, str] = {}
    for h in hosts:
        for key in (h.name, h.host, h.name.replace(" ", ""), h.host.replace(" ", "")):
            idx[key.lower()] = h.hostid
            # also first token / without digits suffix helpers
            idx[re.sub(r"[^a-z0-9]+", "", key.lower())] = h.hostid
    return idx


def _resolve_map_element(
    element: dict[str, Any],
    valid_hostids: set[str],
    name_index: dict[str, str],
) -> str | None:
    etype = str(element.get("elementtype"))
    # 0 = host
    if etype == "0":
        hid = _element_hostid(element)
        if hid and hid in valid_hostids:
            return hid
        return None

    # Image / other: try label match against known hosts (e.g. label "UBUNTU" → Ubuntu-22.04)
    label = str(element.get("label") or "")
    # strip macros like {HOST.NAME}
    label = re.sub(r"\{[^}]+\}", " ", label)
    label = re.sub(r"[\r\n]+", " ", label).strip()
    if not label:
        return None
    candidates = [label, label.split()[0] if label.split() else label]
    for c in candidates:
        compact = re.sub(r"[^a-z0-9]+", "", c.lower())
        # direct
        if c.lower() in name_index:
            return name_index[c.lower()]
        if compact in name_index:
            return name_index[compact]
        # substring match
        for name, hid in name_index.items():
            if compact and (compact in name or name in compact) and len(compact) >= 3:
                return hid
    return None


def _element_hostid(element: dict[str, Any]) -> str | None:
    elems = element.get("elements")
    if isinstance(elems, list) and elems:
        hid = elems[0].get("hostid")
        return str(hid) if hid is not None else None
    hid = element.get("hostid") or element.get("elementid")
    return str(hid) if hid is not None else None


def build_links_from_neighbor_items(
    items: list[dict[str, Any]],
    host_by_name: dict[str, str],
    valid_hostids: set[str],
) -> list[TopologyLink]:
    links: list[TopologyLink] = []
    seen: set[str] = set()
    name_index = {k.lower(): v for k, v in host_by_name.items()}

    for item in items:
        key = str(item.get("key_") or "")
        if not any(p.search(key) for p in _NEIGHBOR_PATTERNS):
            continue
        value = str(item.get("lastvalue") or "").strip()
        if not value or value in ("0", "1", "N/A"):
            continue
        source = str(item.get("hostid"))
        peer = _resolve_peer(value, name_index)
        if not peer or peer == source:
            continue
        if source not in valid_hostids or peer not in valid_hostids:
            continue
        lid = _link_id(source, peer)
        if lid in seen:
            continue
        seen.add(lid)
        links.append(
            TopologyLink(
                id=lid,
                source_hostid=source,
                target_hostid=peer,
                link_type="neighbor_discovery",
                evidence=f"Item {key} → {value}",
                state=LinkState.normal,
                manual=False,
            )
        )
    return links


def _resolve_peer(value: str, name_index: dict[str, str]) -> str | None:
    candidates = [value, value.split(".")[0]]
    for part in re.split(r"[\s,;/|]+", value):
        if part:
            candidates.append(part)
            candidates.append(part.split(".")[0])
    for c in candidates:
        hid = name_index.get(c.lower())
        if hid:
            return hid
    return None


def build_links_from_adjacent_interfaces(hosts: list[HostNode]) -> list[TopologyLink]:
    """
    Detect point-to-point links based on adjacent IP addresses in small subnets (/30, /31, /29).
    This is common for router-to-router, router-to-switch, or switch-to-switch connections.
    """
    links: list[TopologyLink] = []
    seen: set[str] = set()
    host_by_id = {h.hostid: h for h in hosts}
    
    # Build IP -> host mapping
    ip_to_host: dict[str, tuple[str, dict]] = {}  # ip -> (hostid, interface)
    for h in hosts:
        for iface in h.interfaces:
            ip = (iface.ip or "").strip()
            if not ip or ip.startswith("127.") or ip.startswith("169.254."):
                continue
            try:
                addr = ipaddress.ip_address(ip)
                if not isinstance(addr, ipaddress.IPv4Address):
                    continue
                ip_to_host[ip] = (h.hostid, iface)
            except ValueError:
                continue
    
    # Check for adjacent IPs in small subnets
    for ip1, (hid1, iface1) in ip_to_host.items():
        for ip2, (hid2, iface2) in ip_to_host.items():
            if hid1 >= hid2:  # Avoid duplicates and self-connections
                continue
            
            try:
                addr1 = ipaddress.ip_address(ip1)
                addr2 = ipaddress.ip_address(ip2)
                
                # Check if IPs are in the same /30 or /31 subnet (typical for P2P links)
                for prefix in [30, 31, 29, 28]:
                    net1 = ipaddress.ip_network(f"{addr1}/{prefix}", strict=False)
                    net2 = ipaddress.ip_network(f"{addr2}/{prefix}", strict=False)
                    
                    if net1 == net2:
                        lid = _link_id(hid1, hid2, iface1.interfaceid, iface2.interfaceid)
                        if lid in seen:
                            continue
                        seen.add(lid)
                        
                        links.append(
                            TopologyLink(
                                id=lid,
                                source_hostid=hid1,
                                target_hostid=hid2,
                                source_interface=iface1.name or iface1.ip,
                                target_interface=iface2.name or iface2.ip,
                                link_type="adjacent_interface",
                                evidence=f"IPs adjacentes {ip1} et {ip2} dans /{prefix}",
                                state=LinkState.normal,
                                manual=False,
                            )
                        )
                        break  # Found a link, don't check other prefixes
            except ValueError:
                continue
    
    return links


def build_links_from_subnets(hosts: list[HostNode]) -> list[TopologyLink]:
    """
    Logical links justified by shared IPv4 /24 (excluding loopback/link-local).
    Prefer connecting hosts to a switch/router/firewall on the same subnet when present.
    """
    # hostid -> list of networks
    membership: dict[str, list[ipaddress.IPv4Network]] = {}
    host_by_id = {h.hostid: h for h in hosts}

    for h in hosts:
        nets: list[ipaddress.IPv4Network] = []
        for iface in h.interfaces:
            ip = (iface.ip or "").strip()
            if not ip or ip.startswith("127.") or ip.startswith("169.254."):
                continue
            try:
                addr = ipaddress.ip_address(ip)
            except ValueError:
                continue
            if not isinstance(addr, ipaddress.IPv4Address):
                continue
            nets.append(ipaddress.ip_network(f"{addr}/24", strict=False))
        if nets:
            membership[h.hostid] = nets

    # group hostids by network
    by_net: dict[str, list[str]] = {}
    for hid, nets in membership.items():
        for net in nets:
            by_net.setdefault(str(net), []).append(hid)

    links: list[TopologyLink] = []
    seen: set[str] = set()
    hub_types = {DeviceType.switch, DeviceType.router, DeviceType.firewall, DeviceType.network}

    for net, members in by_net.items():
        members = sorted(set(members))
        if len(members) < 2:
            continue
        hubs = [m for m in members if host_by_id[m].device_type in hub_types]
        if hubs:
            hub = hubs[0]
            for other in members:
                if other == hub:
                    continue
                lid = _link_id(hub, other)
                if lid in seen:
                    continue
                seen.add(lid)
                links.append(
                    TopologyLink(
                        id=lid,
                        source_hostid=hub,
                        target_hostid=other,
                        link_type="subnet",
                        evidence=f"Même sous-réseau {net} (liaison logique via équipement réseau)",
                        state=LinkState.normal,
                        manual=False,
                    )
                )
        else:
            # star from first host to avoid full mesh clutter
            root = members[0]
            for other in members[1:]:
                lid = _link_id(root, other)
                if lid in seen:
                    continue
                seen.add(lid)
                links.append(
                    TopologyLink(
                        id=lid,
                        source_hostid=root,
                        target_hostid=other,
                        link_type="subnet",
                        evidence=f"Même sous-réseau {net} (liaison logique)",
                        state=LinkState.normal,
                        manual=False,
                    )
                )
    return links


def enrich_links_with_traffic(
    links: list[TopologyLink],
    items_by_host: dict[str, list[dict[str, Any]]],
    thresholds: dict[str, float] | None = None,
) -> list[TopologyLink]:
    thresholds = thresholds or {"normal_max": 60, "high_max": 80, "warning_max": 90}
    enriched: list[TopologyLink] = []
    for link in links:
        # Prefer traffic from the "non-hub" side if available; else max of both
        candidates = [link.source_hostid, link.target_hostid]
        best_in = None
        best_out = None
        best_speed = None
        for hid in candidates:
            picked = pick_primary_traffic_items(items_by_host.get(hid, []))
            if picked["in"] and (best_in is None or picked["in_val"] > best_in):
                best_in = picked["in_val"]
            if picked["out"] and (best_out is None or picked["out_val"] > best_out):
                best_out = picked["out_val"]
            if picked["speed"]:
                best_speed = picked["speed"]

        util = None
        state = link.state
        if best_in is not None or best_out is not None:
            peak = max(best_in or 0, best_out or 0)
            if best_speed and best_speed > 0:
                util = round(100.0 * peak / best_speed, 1)
                if util >= thresholds["warning_max"]:
                    state = LinkState.problem
                elif util >= thresholds["high_max"]:
                    state = LinkState.high_traffic
                elif util >= thresholds["normal_max"]:
                    state = LinkState.high_traffic
                else:
                    state = LinkState.normal
            else:
                state = LinkState.normal

        enriched.append(
            link.model_copy(
                update={
                    "in_bps": best_in,
                    "out_bps": best_out,
                    "bandwidth_bps": best_speed,
                    "utilization_pct": util,
                    "state": state,
                }
            )
        )
    return enriched


def merge_links(*groups: list[TopologyLink]) -> list[TopologyLink]:
    by_id: dict[str, TopologyLink] = {}
    priority = {"neighbor_discovery": 3, "zabbix_map": 2, "subnet": 1, "demo": 0, "discovered": 1}
    for group in groups:
        for link in group:
            existing = by_id.get(link.id)
            if not existing:
                by_id[link.id] = link
                continue
            if priority.get(link.link_type, 0) > priority.get(existing.link_type, 0):
                by_id[link.id] = link
    return list(by_id.values())
