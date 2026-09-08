import type { LayoutPayload, TopologyDiff, TopologyGraph } from "./types";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

function headers(sessionId?: string | null): HeadersInit {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (sessionId) h["X-Session-Id"] = sessionId;
  return h;
}

async function request<T>(path: string, init: RequestInit = {}, sessionId?: string | null): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { ...headers(sessionId), ...(init.headers || {}) },
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail || JSON.stringify(body);
    } catch {
      /* ignore */
    }
    throw new Error(typeof detail === "string" ? detail : "Erreur API");
  }
  return res.json() as Promise<T>;
}

export interface ConnectBody {
  url: string;
  auth_method: "password" | "token";
  username?: string;
  password?: string;
  token?: string;
  verify_ssl?: boolean;
}

export const api = {
  health: () => request<{ status: string }>("/api/health"),

  connect: (body: ConnectBody) =>
    request<{ session_id: string; zabbix_version: string; message: string }>("/api/connect", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  demo: () =>
    request<{ session_id: string; zabbix_version: string; message: string }>("/api/demo", {
      method: "POST",
    }),

  disconnect: (sessionId: string) =>
    request<{ ok: boolean }>("/api/disconnect", { method: "POST" }, sessionId),

  topology: (sessionId: string) =>
    request<{ graph: TopologyGraph; diff: TopologyDiff }>("/api/topology", {}, sessionId),

  hostDetail: (sessionId: string, hostid: string) =>
    request<{ host: import("./types").HostNode; links: import("./types").TopologyLink[] }>(
      `/api/hosts/${hostid}`,
      {},
      sessionId,
    ),

  getLayout: (sessionId: string) =>
    request<{ layout: LayoutPayload | null; preferences: Record<string, unknown> }>(
      "/api/layout",
      {},
      sessionId,
    ),

  saveLayout: (sessionId: string, payload: LayoutPayload) =>
    request<{ ok: boolean }>("/api/layout", { method: "PUT", body: JSON.stringify(payload) }, sessionId),

  history: (sessionId: string, itemid: string, hours = 1) =>
    request<{ itemid: string; name: string; units?: string; points: { clock: number; value: number }[] }>(
      `/api/history/${itemid}?hours=${hours}`,
      {},
      sessionId,
    ),
};
