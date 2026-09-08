from __future__ import annotations

from typing import Any

import httpx


class ZabbixAPIError(Exception):
    def __init__(self, message: str, code: str | None = None, details: Any = None):
        super().__init__(message)
        self.code = code
        self.details = details


def parse_version(version: str | None) -> tuple[int, int]:
    if not version or version == "demo":
        return (0, 0)
    parts = str(version).split(".")
    try:
        major = int(parts[0])
        minor = int(parts[1]) if len(parts) > 1 else 0
        return major, minor
    except ValueError:
        return (0, 0)


class ZabbixClient:
    """Thin JSON-RPC client for Zabbix API (generic, no hard-coded hostnames)."""

    def __init__(
        self,
        url: str,
        *,
        auth: str | None = None,
        verify_ssl: bool = True,
        timeout: float = 30.0,
        api_version: str | None = None,
    ):
        self.url = url.rstrip("/")
        if not self.url.endswith("api_jsonrpc.php"):
            if "/api_jsonrpc.php" not in self.url:
                self.url = f"{self.url}/api_jsonrpc.php"
        self.auth = auth
        self.verify_ssl = verify_ssl
        self.timeout = timeout
        self.api_version = api_version
        self._id = 0

    def _next_id(self) -> int:
        self._id += 1
        return self._id

    @property
    def major_minor(self) -> tuple[int, int]:
        return parse_version(self.api_version)

    def _apply_auth(self, method: str, payload: dict[str, Any], headers: dict[str, str]) -> None:
        """
        Zabbix auth rules:
        - < 6.4 : auth in JSON-RPC body
        - 6.4–6.x : Bearer header and/or body auth
        - >= 7.0 : Bearer header ONLY (body "auth" is rejected)
        """
        if not self.auth or method in ("apiinfo.version", "user.login"):
            return

        major, minor = self.major_minor
        use_header = major > 7 or (major == 7) or (major == 6 and minor >= 4) or major == 0
        use_body = major < 7 and not (major == 0)

        # If version unknown yet, prefer header-only (safe for Zabbix 7+)
        if major == 0:
            headers["Authorization"] = f"Bearer {self.auth}"
            return

        if use_header:
            headers["Authorization"] = f"Bearer {self.auth}"
        if use_body:
            payload["auth"] = self.auth

    async def call(self, method: str, params: dict[str, Any] | list[Any] | None = None) -> Any:
        payload: dict[str, Any] = {
            "jsonrpc": "2.0",
            "method": method,
            "params": params if params is not None else {},
            "id": self._next_id(),
        }
        headers = {"Content-Type": "application/json-rpc"}
        self._apply_auth(method, payload, headers)

        try:
            async with httpx.AsyncClient(verify=self.verify_ssl, timeout=self.timeout) as client:
                response = await client.post(self.url, json=payload, headers=headers)
                response.raise_for_status()
                data = response.json()
        except httpx.TimeoutException as exc:
            raise ZabbixAPIError("Timeout lors de l'appel à l'API Zabbix", code="timeout") from exc
        except httpx.ConnectError as exc:
            raise ZabbixAPIError("API Zabbix inaccessible (connexion refusée)", code="unreachable") from exc
        except httpx.HTTPStatusError as exc:
            raise ZabbixAPIError(
                f"Erreur HTTP {exc.response.status_code} depuis Zabbix",
                code="http_error",
            ) from exc
        except Exception as exc:  # noqa: BLE001
            raise ZabbixAPIError(f"Erreur réseau: {exc}", code="network") from exc

        if "error" in data:
            err = data["error"]
            message = err.get("data") or err.get("message") or "Erreur API Zabbix"
            raise ZabbixAPIError(str(message), code=str(err.get("code", "api_error")), details=err)

        return data.get("result")

    async def version(self) -> str:
        result = await self.call("apiinfo.version")
        self.api_version = str(result)
        return self.api_version

    async def login(self, username: str, password: str) -> str:
        token = await self.call("user.login", {"username": username, "password": password})
        self.auth = str(token)
        return self.auth

    async def login_legacy(self, user: str, password: str) -> str:
        """Fallback for older Zabbix that expect 'user' instead of 'username'."""
        try:
            return await self.login(user, password)
        except ZabbixAPIError:
            token = await self.call("user.login", {"user": user, "password": password})
            self.auth = str(token)
            return self.auth

    async def logout(self) -> None:
        if not self.auth:
            return
        try:
            await self.call("user.logout", [])
        except ZabbixAPIError:
            pass
        finally:
            self.auth = None

    async def get_hosts(self) -> list[dict[str, Any]]:
        major, _ = self.major_minor
        # host.available removed in recent Zabbix — availability lives on interfaces
        output = ["hostid", "host", "name", "status", "description"]
        params: dict[str, Any] = {
            "output": output,
            "selectInterfaces": ["interfaceid", "ip", "dns", "port", "type", "main", "available"],
            "selectParentTemplates": ["templateid", "name"],
            "selectTags": "extend",
            "filter": {"status": 0},
        }
        # Zabbix 7+: selectHostGroups ; older: selectGroups
        if major >= 7:
            params["selectHostGroups"] = ["groupid", "name"]
        else:
            params["selectGroups"] = ["groupid", "name"]

        try:
            hosts = await self.call("host.get", params)
        except ZabbixAPIError:
            # Retry with the other groups selector if version detection was wrong
            params.pop("selectHostGroups", None)
            params.pop("selectGroups", None)
            params["selectHostGroups"] = ["groupid", "name"]
            try:
                hosts = await self.call("host.get", params)
            except ZabbixAPIError:
                params.pop("selectHostGroups", None)
                params["selectGroups"] = ["groupid", "name"]
                hosts = await self.call("host.get", params)

        # Normalize hostgroups → groups for the rest of the app
        for host in hosts or []:
            if "groups" not in host and "hostgroups" in host:
                host["groups"] = host["hostgroups"]
        return hosts or []

    async def get_problems(self, hostids: list[str] | None = None) -> list[dict[str, Any]]:
        params: dict[str, Any] = {
            "output": ["eventid", "name", "severity", "clock", "objectid"],
            "recent": True,
            "sortfield": ["eventid"],
            "sortorder": "DESC",
            "limit": 500,
        }
        if hostids:
            params["hostids"] = hostids
        return await self.call("problem.get", params)

    async def get_items(
        self,
        hostids: list[str],
        search_keys: list[str] | None = None,
    ) -> list[dict[str, Any]]:
        params: dict[str, Any] = {
            "output": ["itemid", "hostid", "name", "key_", "lastvalue", "units", "value_type", "status"],
            "hostids": hostids,
            "filter": {"status": 0},
            "limit": 5000,
        }
        if search_keys:
            params["search"] = {"key_": search_keys[0]}
            params["searchWildcardsEnabled"] = True
        return await self.call("item.get", params)

    async def get_history(
        self,
        itemid: str,
        value_type: int,
        time_from: int,
        time_till: int,
        limit: int = 1000,
    ) -> list[dict[str, Any]]:
        return await self.call(
            "history.get",
            {
                "output": "extend",
                "history": value_type,
                "itemids": itemid,
                "time_from": time_from,
                "time_till": time_till,
                "sortfield": "clock",
                "sortorder": "ASC",
                "limit": limit,
            },
        )

    async def get_maps(self) -> list[dict[str, Any]]:
        try:
            return await self.call(
                "map.get",
                {
                    "output": ["sysmapid", "name"],
                    "selectSelements": "extend",
                    "selectLinks": "extend",
                },
            )
        except ZabbixAPIError:
            return []
