import { memo } from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { DEVICE_ICONS } from "../lib/icons";
import { DEVICE_LABELS, HEALTH_COLORS, HEALTH_LABELS, formatBps } from "../lib/labels";
import type { DeviceType, HealthState, LiveStats } from "../types";
import { useAppStore } from "../store";

export type DeviceNodeData = {
  hostid: string;
  label: string;
  ip?: string | null;
  deviceType: DeviceType;
  health: HealthState;
  problemCount: number;
  groups: string[];
  live?: LiveStats | null;
};

export type DeviceFlowNode = Node<DeviceNodeData, "device">;

function DeviceNodeComponent({ data, selected }: NodeProps<DeviceFlowNode>) {
  const prefs = useAppStore((s) => s.prefs);
  const Icon = DEVICE_ICONS[data.deviceType] ?? DEVICE_ICONS.other;
  const color = HEALTH_COLORS[data.health];
  const scale = prefs.nodeScale;
  const live = data.live;

  return (
    <div
      className={`device-node mode-${prefs.mode} ${selected ? "selected" : ""}`}
      style={{
        ["--health" as string]: color,
        transform: `scale(${scale})`,
        transformOrigin: "top left",
      }}
      title={`${data.label} — ${HEALTH_LABELS[data.health]}`}
    >
      <Handle type="target" position={Position.Left} className="device-handle" />
      <div className="device-node__status" aria-hidden />
      <div className="device-node__icon">
        <Icon size={20} strokeWidth={1.75} />
      </div>
      <div className="device-node__body">
        {prefs.showLabels && <div className="device-node__name">{data.label}</div>}
        {prefs.showIps && data.ip && <div className="device-node__ip">{data.ip}</div>}
        {prefs.mode !== "simple" && (
          <div className="device-node__meta">
            <span>{DEVICE_LABELS[data.deviceType]}</span>
            {prefs.showStates && <span className="device-node__health">{HEALTH_LABELS[data.health]}</span>}
          </div>
        )}
        {prefs.mode !== "simple" && live && (
          <div className="device-node__live">
            {live.cpu_pct != null && (
              <span title="CPU">
                CPU <strong>{live.cpu_pct.toFixed(0)}%</strong>
              </span>
            )}
            {live.mem_pct != null && (
              <span title="Mémoire">
                MEM <strong>{live.mem_pct.toFixed(0)}%</strong>
              </span>
            )}
            {prefs.showTraffic && (live.net_in_bps != null || live.net_out_bps != null) && (
              <span title="Trafic réseau">
                ↓{formatBps(live.net_in_bps)} ↑{formatBps(live.net_out_bps)}
              </span>
            )}
            {live.cpu_pct == null && live.mem_pct == null && live.net_in_bps == null && (
              <span className="dim">Pas de métrique</span>
            )}
          </div>
        )}
        {prefs.mode === "detailed" && data.groups[0] && (
          <div className="device-node__group">{data.groups[0]}</div>
        )}
      </div>
      {data.problemCount > 0 && prefs.mode !== "simple" && (
        <div className="device-node__badge" title={`${data.problemCount} problème(s) actif(s)`}>
          {data.problemCount}
        </div>
      )}
      <Handle type="source" position={Position.Right} className="device-handle" />
    </div>
  );
}

export const DeviceNode = memo(DeviceNodeComponent);
