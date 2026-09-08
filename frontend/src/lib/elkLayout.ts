import ELK, { type ElkNode } from "elkjs/lib/elk.bundled.js";
import type { Edge, Node } from "@xyflow/react";

const elk = new ELK();

export async function layoutWithElk(
  nodes: Node[],
  edges: Edge[],
  direction: "RIGHT" | "DOWN" | "LEFT" | "UP" = "RIGHT",
): Promise<Node[]> {
  const graph: ElkNode = {
    id: "root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": direction,
      "elk.spacing.nodeNode": "72",
      "elk.layered.spacing.nodeNodeBetweenLayers": "110",
      "elk.edgeRouting": "ORTHOGONAL",
      "elk.layered.nodePlacement.strategy": "NETWORK_SIMPLEX",
      "elk.layered.crossingMinimization.strategy": "LAYER_SWEEP",
      "elk.padding": "[40,40,40,40]",
    },
    children: nodes.map((n) => ({
      id: n.id,
      width: (n.measured?.width ?? n.width ?? 200) as number,
      height: (n.measured?.height ?? n.height ?? 88) as number,
    })),
    edges: edges.map((e) => ({
      id: e.id,
      sources: [e.source],
      targets: [e.target],
    })),
  };

  const layouted = await elk.layout(graph);
  const byId = new Map((layouted.children || []).map((c) => [c.id, c]));

  return nodes.map((node) => {
    const pos = byId.get(node.id);
    return {
      ...node,
      position: {
        x: pos?.x ?? node.position.x,
        y: pos?.y ?? node.position.y,
      },
    };
  });
}
