import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  useEdgesState,
  useNodesState,
  type Node,
  type Edge,
  type NodeTypes,
  type EdgeTypes,
  ConnectionMode,
  type OnNodeDrag,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { DeviceNode, type DeviceFlowNode } from "./DeviceNode";
import { LinkEdge, type LinkFlowEdge } from "./LinkEdge";
import { layoutWithElk } from "../lib/elkLayout";
import { HEALTH_COLORS } from "../lib/labels";
import { useAppStore } from "../store";
import type { HostNode, TopologyLink } from "../types";

const nodeTypes: NodeTypes = { device: DeviceNode };
const edgeTypes: EdgeTypes = { link: LinkEdge };

function hostToNode(host: HostNode, position: { x: number; y: number }): DeviceFlowNode {
  return {
    id: host.hostid,
    type: "device",
    position,
    data: {
      hostid: host.hostid,
      label: host.name,
      ip: host.ip,
      deviceType: host.device_type,
      health: host.health,
      problemCount: host.problems.length,
      groups: host.groups,
      live: host.live,
    },
    width: 220,
    height: 110,
  };
}

function linkToEdge(link: TopologyLink): LinkFlowEdge {
  return {
    id: link.id,
    type: "link",
    source: link.source_hostid,
    target: link.target_hostid,
    data: {
      state: link.state,
      evidence: link.evidence,
      utilization_pct: link.utilization_pct,
      in_bps: link.in_bps,
      out_bps: link.out_bps,
      link_type: link.link_type,
    },
  };
}

interface Props {
  onRelayoutRequest?: number;
}

export function TopologyCanvas({ onRelayoutRequest = 0 }: Props) {
  const graph = useAppStore((s) => s.graph);
  const prefs = useAppStore((s) => s.prefs);
  const searchQuery = useAppStore((s) => s.searchQuery);
  const groupFilter = useAppStore((s) => s.groupFilter);
  const typeFilter = useAppStore((s) => s.typeFilter);
  const healthFilter = useAppStore((s) => s.healthFilter);
  const savedPositions = useAppStore((s) => s.savedPositions);
  const setSelectedHost = useAppStore((s) => s.setSelectedHost);
  const setSelectedLink = useAppStore((s) => s.setSelectedLink);
  const updatePosition = useAppStore((s) => s.updatePosition);
  const setSavedPositions = useAppStore((s) => s.setSavedPositions);

  const [nodes, setNodes, onNodesChange] = useNodesState<DeviceFlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<LinkFlowEdge>([]);
  const [ready, setReady] = useState(false);

  const filteredHosts = useMemo(() => {
    if (!graph) return [];
    const q = searchQuery.trim().toLowerCase();
    return graph.hosts.filter((h) => {
      if (groupFilter && !h.groups.includes(groupFilter)) return false;
      if (typeFilter && h.device_type !== typeFilter) return false;
      if (healthFilter && h.health !== healthFilter) return false;
      if (!q) return true;
      return (
        h.name.toLowerCase().includes(q) ||
        h.host.toLowerCase().includes(q) ||
        (h.ip || "").toLowerCase().includes(q)
      );
    });
  }, [graph, searchQuery, groupFilter, typeFilter, healthFilter]);

  const filteredHostIds = useMemo(() => new Set(filteredHosts.map((h) => h.hostid)), [filteredHosts]);

  const applyLayout = useCallback(
    async (force = false) => {
      if (!graph) return;
      const hostNodes = filteredHosts.map((h, i) => {
        const saved = savedPositions[h.hostid];
        return hostToNode(h, saved ?? { x: (i % 5) * 240, y: Math.floor(i / 5) * 140 });
      });
      const linkEdges = (graph.links || [])
        .filter((l) => filteredHostIds.has(l.source_hostid) && filteredHostIds.has(l.target_hostid))
        .map(linkToEdge);

      const needLayout =
        force ||
        hostNodes.some((n) => !savedPositions[n.id]) ||
        Object.keys(savedPositions).length === 0;

      let laidOut = hostNodes;
      if (needLayout) {
        // Keep known positions; only auto-place missing ones via full ELK when forced or empty
        if (force || Object.keys(savedPositions).length === 0) {
          laidOut = (await layoutWithElk(hostNodes, linkEdges, prefs.layoutDirection)) as DeviceFlowNode[];
          const next: Record<string, { x: number; y: number }> = {};
          for (const n of laidOut) next[n.id] = { x: n.position.x, y: n.position.y };
          setSavedPositions(next);
        } else {
          const missing = hostNodes.filter((n) => !savedPositions[n.id]);
          if (missing.length) {
            const temp = await layoutWithElk(hostNodes, linkEdges, prefs.layoutDirection);
            laidOut = hostNodes.map((n) => {
              if (savedPositions[n.id]) {
                return { ...n, position: savedPositions[n.id] };
              }
              const found = temp.find((t) => t.id === n.id);
              return found ? { ...n, position: found.position } : n;
            }) as DeviceFlowNode[];
            const next = { ...savedPositions };
            for (const n of laidOut) {
              if (!next[n.id]) next[n.id] = { x: n.position.x, y: n.position.y };
            }
            setSavedPositions(next);
          }
        }
      }

      setNodes(laidOut);
      setEdges(linkEdges);
      setReady(true);
    },
    [
      graph,
      filteredHosts,
      filteredHostIds,
      savedPositions,
      prefs.layoutDirection,
      setNodes,
      setEdges,
      setSavedPositions,
    ],
  );

  useEffect(() => {
    void applyLayout(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph, filteredHosts, prefs.layoutDirection]);

  useEffect(() => {
    if (onRelayoutRequest > 0) void applyLayout(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onRelayoutRequest]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const host = graph?.hosts.find((h) => h.hostid === node.id) || null;
      setSelectedHost(host);
    },
    [graph, setSelectedHost],
  );

  const onEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      const link = graph?.links.find((l) => l.id === edge.id) || null;
      setSelectedLink(link);
    },
    [graph, setSelectedLink],
  );

  const onNodeDragStop: OnNodeDrag = useCallback(
    (_event, node) => {
      updatePosition(node.id, node.position.x, node.position.y);
    },
    [updatePosition],
  );

  if (!graph) {
    return <div className="canvas-empty">Aucune topologie chargée</div>;
  }

  return (
    <div className="topology-canvas">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onNodeDragStop={onNodeDragStop}
        onPaneClick={() => {
          setSelectedHost(null);
          setSelectedLink(null);
        }}
        fitView
        fitViewOptions={{ padding: 0.18 }}
        minZoom={0.2}
        maxZoom={2}
        connectionMode={ConnectionMode.Loose}
        proOptions={{ hideAttribution: true }}
        nodesDraggable
        elementsSelectable
      >
        <Background variant={BackgroundVariant.Dots} gap={22} size={1.2} color="#c5ced8" />
        <Controls showInteractive={false} />
        <MiniMap
          nodeColor={(n) => {
            const health = (n.data as DeviceFlowNode["data"])?.health;
            return health ? HEALTH_COLORS[health] : "#94a3b8";
          }}
          maskColor="rgba(15, 23, 42, 0.12)"
          pannable
          zoomable
        />
      </ReactFlow>
      {!ready && <div className="canvas-loading">Organisation de la topologie…</div>}
    </div>
  );
}
