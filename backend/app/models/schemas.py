from __future__ import annotations

from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class AuthMethod(str, Enum):
    password = "password"
    token = "token"


class DeviceType(str, Enum):
    server = "server"
    workstation = "workstation"
    vm = "vm"
    router = "router"
    switch = "switch"
    firewall = "firewall"
    network = "network"
    printer = "printer"
    other = "other"


class HealthState(str, Enum):
    ok = "ok"
    warning = "warning"
    critical = "critical"
    unknown = "unknown"
    unavailable = "unavailable"


class LinkState(str, Enum):
    normal = "normal"
    high_traffic = "high_traffic"
    errors = "errors"
    down = "down"
    problem = "problem"
    unavailable = "unavailable"


class ConnectRequest(BaseModel):
    url: str = Field(..., description="Zabbix API URL, e.g. https://zabbix.example.com/api_jsonrpc.php")
    auth_method: AuthMethod = AuthMethod.password
    username: str | None = None
    password: str | None = None
    token: str | None = None
    verify_ssl: bool = True


class ConnectResponse(BaseModel):
    session_id: str
    zabbix_version: str
    message: str


class HostInterface(BaseModel):
    interfaceid: str
    hostid: str
    ip: str | None = None
    dns: str | None = None
    port: str | None = None
    type: int | None = None  # 1 agent, 2 SNMP, 3 IPMI, 4 JMX
    main: bool = False
    available: int | None = None  # 0 unknown, 1 available, 2 unavailable
    name: str | None = None


class ProblemSummary(BaseModel):
    eventid: str
    name: str
    severity: int
    clock: int | None = None


class MetricSnapshot(BaseModel):
    key: str
    name: str
    value: str | None = None
    units: str | None = None
    itemid: str | None = None


class LiveStats(BaseModel):
    cpu_pct: float | None = None
    mem_pct: float | None = None
    disk_pct: float | None = None
    net_in_bps: float | None = None
    net_out_bps: float | None = None
    icmp_loss_pct: float | None = None
    icmp_latency_sec: float | None = None
    uptime_sec: float | None = None


class HostNode(BaseModel):
    hostid: str
    name: str
    host: str
    status: int  # 0 enabled, 1 disabled
    available: int | None = None
    ip: str | None = None
    device_type: DeviceType = DeviceType.other
    health: HealthState = HealthState.unknown
    groups: list[str] = Field(default_factory=list)
    templates: list[str] = Field(default_factory=list)
    interfaces: list[HostInterface] = Field(default_factory=list)
    problems: list[ProblemSummary] = Field(default_factory=list)
    metrics: list[MetricSnapshot] = Field(default_factory=list)
    live: LiveStats = Field(default_factory=LiveStats)
    description: str | None = None


class TopologyLink(BaseModel):
    id: str
    source_hostid: str
    target_hostid: str
    source_interface: str | None = None
    target_interface: str | None = None
    link_type: str = "discovered"
    evidence: str
    state: LinkState = LinkState.unavailable
    bandwidth_bps: float | None = None
    in_bps: float | None = None
    out_bps: float | None = None
    errors: float | None = None
    drops: float | None = None
    utilization_pct: float | None = None
    manual: bool = False


class TopologyGraph(BaseModel):
    hosts: list[HostNode]
    links: list[TopologyLink]
    generated_at: str
    zabbix_version: str | None = None


class LayoutNode(BaseModel):
    hostid: str
    x: float
    y: float
    width: float | None = None
    height: float | None = None


class LayoutPayload(BaseModel):
    nodes: list[LayoutNode]
    display: dict[str, Any] = Field(default_factory=dict)
    preferences: dict[str, Any] = Field(default_factory=dict)


class ThresholdConfig(BaseModel):
    normal_max: float = 60.0
    high_max: float = 80.0
    warning_max: float = 90.0
    # critical: > warning_max


class TopologyDiff(BaseModel):
    added_hosts: list[str] = Field(default_factory=list)
    removed_hosts: list[str] = Field(default_factory=list)
    added_links: list[str] = Field(default_factory=list)
    removed_links: list[str] = Field(default_factory=list)
    health_changes: list[dict[str, Any]] = Field(default_factory=list)
    new_problems: int = 0
    resolved_problems: int = 0


class HistoryPoint(BaseModel):
    clock: int
    value: float


class HistorySeries(BaseModel):
    itemid: str
    name: str
    units: str | None = None
    points: list[HistoryPoint]
