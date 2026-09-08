import asyncio
import json
from app.zabbix.client import ZabbixClient


async def main():
    c = ZabbixClient(
        "http://192.168.1.13/api_jsonrpc.php",
        verify_ssl=False,
        api_version="7.4.13",
    )
    await c.version()
    await c.login("Admin", "zabbix")
    maps = await c.call(
        "map.get",
        {
            "output": "extend",
            "selectSelements": "extend",
            "selectLinks": "extend",
            "filter": {"name": "Local network"},
        },
    )
    print(json.dumps(maps, indent=2)[:8000])

    # also memory keys sample
    items = await c.call(
        "item.get",
        {
            "output": ["hostid", "key_", "name", "lastvalue", "units"],
            "search": {"key_": "vm.memory"},
            "searchWildcardsEnabled": True,
            "monitored": True,
            "limit": 30,
        },
    )
    print("\nMEMORY ITEMS")
    for it in items or []:
        print(it)


if __name__ == "__main__":
    asyncio.run(main())
