export type DeviceType =
  | "server"
  | "workstation"
  | "vm"
  | "router"
  | "switch"
  | "firewall"
  | "network"
  | "printer"
  | "other";

export type HealthState = "ok" | "warning" | "critical" | "unknown" | "unavailable";

export type LinkState =
  | "normal"
  | "high_traffic"
  | "errors"
  | "down"
  | "problem"
  | "unavailable";

export type DisplayMode = "simple" | "supervision" | "detailed";

export interface HostInterface {
  interfaceid: string;
  hostid: string;
  ip?: string | null;
  dns?: string | null;
  port?: string | null;
  type?: number | null;
  main: boolean;
  available?: number | null;
  name?: string | null;
}

export interface ProblemSummary {
  eventid: string;
  name: string;
  severity: number;
  clock?: number | null;
}

export interface MetricSnapshot {
  key: string;
  name: string;
  value?: string | null;
  units?: string | null;
  itemid?: string | null;
}

export interface LiveStats {
  cpu_pct?: number | null;
  mem_pct?: number | null;
  disk_pct?: number | null;
  net_in_bps?: number | null;
  net_out_bps?: number | null;
  icmp_loss_pct?: number | null;
  icmp_latency_sec?: number | null;
  uptime_sec?: number | null;
}

export interface HostNode {
  hostid: string;
  name: string;
  host: string;
  status: number;
  available?: number | null;
  ip?: string | null;
  device_type: DeviceType;
  health: HealthState;
  groups: string[];
  templates: string[];
  interfaces: HostInterface[];
  problems: ProblemSummary[];
  metrics: MetricSnapshot[];
  live?: LiveStats;
  description?: string | null;
}

export interface TopologyLink {
  id: string;
  source_hostid: string;
  target_hostid: string;
  source_interface?: string | null;
  target_interface?: string | null;
  link_type: string;
  evidence: string;
  state: LinkState;
  bandwidth_bps?: number | null;
  in_bps?: number | null;
  out_bps?: number | null;
  errors?: number | null;
  drops?: number | null;
  utilization_pct?: number | null;
  manual: boolean;
}

export interface TopologyGraph {
  hosts: HostNode[];
  links: TopologyLink[];
  generated_at: string;
  zabbix_version?: string | null;
}

export interface TopologyDiff {
  added_hosts: string[];
  removed_hosts: string[];
  added_links: string[];
  removed_links: string[];
  health_changes: { hostid: string; from: string; to: string }[];
  new_problems: number;
  resolved_problems: number;
}

export interface LayoutNode {
  hostid: string;
  x: number;
  y: number;
  width?: number | null;
  height?: number | null;
}

export interface LayoutPayload {
  nodes: LayoutNode[];
  display: Record<string, unknown>;
  preferences: Record<string, unknown>;
}

export interface Thresholds {
  normal_max: number;
  high_max: number;
  warning_max: number;
}

export interface DisplayPrefs {
  mode: DisplayMode;
  showTraffic: boolean;
  showIps: boolean;
  showLabels: boolean;
  showStates: boolean;
  nodeScale: number;
  layoutDirection: "RIGHT" | "DOWN" | "LEFT" | "UP";
  thresholds: Thresholds;
}
