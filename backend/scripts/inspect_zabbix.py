import asyncio
from app.zabbix.client import ZabbixClient


async def main():
    c = ZabbixClient(
        "http://192.168.1.13/api_jsonrpc.php",
        verify_ssl=False,
        api_version="7.4.13",
    )
    await c.version()
    await c.login("Admin", "zabbix")
    hosts = await c.get_hosts()
    print("HOSTS", len(hosts))
    for h in hosts:
        ifaces = h.get("interfaces") or []
        groups = h.get("groups") or h.get("hostgroups") or []
        print(
            f"- {h['name']} id={h['hostid']} "
            f"ifaces={[(i.get('ip'), i.get('type'), i.get('available')) for i in ifaces]} "
            f"groups={[g.get('name') for g in groups]} "
            f"templates={[t.get('name') for t in (h.get('parentTemplates') or [])]}"
        )

    hostids = [h["hostid"] for h in hosts]
    items = await c.call(
        "item.get",
        {
            "output": ["itemid", "hostid", "name", "key_", "lastvalue", "units", "value_type", "status"],
            "hostids": hostids,
            "filter": {"status": 0},
            "monitored": True,
            "limit": 500,
        },
    )
    print("\nITEMS", len(items or []))
    by = {}
    for it in items or []:
        by.setdefault(it["hostid"], []).append(it)
    for h in hosts:
        its = by.get(h["hostid"], [])
        print(f"\n=== {h['name']} ({len(its)} items) ===")
        for it in its[:40]:
            print(
                f"  {it['key_'][:90]} | {it['name'][:55]} | "
                f"val={str(it.get('lastvalue'))[:45]} {it.get('units') or ''}"
            )

    maps = await c.get_maps()
    print("\nMAPS", len(maps or []), [m.get("name") for m in (maps or [])])

    tr = await c.call(
        "trigger.get",
        {
            "output": ["triggerid", "description", "priority", "value"],
            "hostids": hostids,
            "filter": {"value": 1},
            "monitored": True,
            "selectHosts": ["hostid", "name"],
            "limit": 50,
        },
    )
    print("\nPROBLEMS", len(tr or []))
    for t in (tr or [])[:15]:
        print(" ", t.get("description"), [x.get("name") for x in t.get("hosts") or []])

    all_keys = [it["key_"] for it in (items or [])]
    neigh = [k for k in all_keys if any(x in k.lower() for x in ["lldp", "cdp", "neigh", "peer", "remote"])]
    print("\nNEIGHBOR_KEYS", neigh[:50])
    net = [k for k in all_keys if "net.if" in k.lower() or "ifHC" in k or "ifIn" in k or "ifOut" in k]
    print("NET_IF_KEYS", len(net))
    print("sample", net[:30])


if __name__ == "__main__":
    asyncio.run(main())
