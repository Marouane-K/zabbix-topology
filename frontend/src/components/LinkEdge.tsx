import { memo } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type Edge,
  type EdgeProps,
} from "@xyflow/react";
import { LINK_COLORS, formatBps } from "../lib/labels";
import type { LinkState } from "../types";
import { useAppStore } from "../store";

export type LinkEdgeData = {
  state: LinkState;
  evidence: string;
  utilization_pct?: number | null;
  in_bps?: number | null;
  out_bps?: number | null;
  link_type: string;
};

export type LinkFlowEdge = Edge<LinkEdgeData, "link">;

function LinkEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps<LinkFlowEdge>) {
  const prefs = useAppStore((s) => s.prefs);
  const [path, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 16,
  });

  const state = data?.state ?? "unavailable";
  const color = LINK_COLORS[state];
  const dashed = state === "unavailable" || state === "down";
  const thick = state === "high_traffic" || state === "problem" || state === "errors";

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        style={{
          stroke: color,
          strokeWidth: selected ? 3.5 : thick ? 2.75 : 2,
          strokeDasharray: dashed ? "6 4" : undefined,
          opacity: selected ? 1 : 0.88,
        }}
      />
      {prefs.showTraffic && prefs.mode !== "simple" && data && (data.utilization_pct != null || data.in_bps != null) && (
        <EdgeLabelRenderer>
          <div
            className={`link-label ${selected ? "selected" : ""} band-${state}`}
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            }}
          >
            {data.utilization_pct != null ? (
              <div className="link-traffic">
                <span className="utilization">{data.utilization_pct.toFixed(0)}%</span>
                <span className="speed">{formatBps((data.in_bps || 0) + (data.out_bps || 0))}</span>
              </div>
            ) : (
              <div className="link-traffic">
                <span className="direction">↓{formatBps(data.in_bps || 0)}</span>
                <span className="direction">↑{formatBps(data.out_bps || 0)}</span>
              </div>
            )}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export const LinkEdge = memo(LinkEdgeComponent);
