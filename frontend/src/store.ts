import { create } from "zustand";
import type { DisplayPrefs, HostNode, TopologyDiff, TopologyGraph, TopologyLink } from "./types";

const defaultPrefs: DisplayPrefs = {
  mode: "supervision",
  showTraffic: true,
  showIps: true,
  showLabels: true,
  showStates: true,
  nodeScale: 1,
  layoutDirection: "RIGHT",
  thresholds: { normal_max: 60, high_max: 80, warning_max: 90 },
};

interface AppState {
  sessionId: string | null;
  zabbixVersion: string | null;
  graph: TopologyGraph | null;
  diff: TopologyDiff | null;
  selectedHost: HostNode | null;
  selectedLink: TopologyLink | null;
  prefs: DisplayPrefs;
  searchQuery: string;
  groupFilter: string | null;
  typeFilter: string | null;
  healthFilter: string | null;
  loading: boolean;
  error: string | null;
  savedPositions: Record<string, { x: number; y: number }>;
  setSession: (id: string | null, version?: string | null) => void;
  setGraph: (graph: TopologyGraph, diff: TopologyDiff) => void;
  setSelectedHost: (host: HostNode | null) => void;
  setSelectedLink: (link: TopologyLink | null) => void;
  setPrefs: (partial: Partial<DisplayPrefs>) => void;
  setSearchQuery: (q: string) => void;
  setGroupFilter: (g: string | null) => void;
  setTypeFilter: (t: string | null) => void;
  setHealthFilter: (h: string | null) => void;
  setLoading: (v: boolean) => void;
  setError: (e: string | null) => void;
  setSavedPositions: (p: Record<string, { x: number; y: number }>) => void;
  updatePosition: (hostid: string, x: number, y: number) => void;
  reset: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  sessionId: null,
  zabbixVersion: null,
  graph: null,
  diff: null,
  selectedHost: null,
  selectedLink: null,
  prefs: defaultPrefs,
  searchQuery: "",
  groupFilter: null,
  typeFilter: null,
  healthFilter: null,
  loading: false,
  error: null,
  savedPositions: {},
  setSession: (id, version = null) => set({ sessionId: id, zabbixVersion: version }),
  setGraph: (graph, diff) => set({ graph, diff }),
  setSelectedHost: (host) => set({ selectedHost: host, selectedLink: null }),
  setSelectedLink: (link) => set({ selectedLink: link, selectedHost: null }),
  setPrefs: (partial) => set((s) => ({ prefs: { ...s.prefs, ...partial } })),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setGroupFilter: (g) => set({ groupFilter: g }),
  setTypeFilter: (t) => set({ typeFilter: t }),
  setHealthFilter: (h) => set({ healthFilter: h }),
  setLoading: (v) => set({ loading: v }),
  setError: (e) => set({ error: e }),
  setSavedPositions: (p) => set({ savedPositions: p }),
  updatePosition: (hostid, x, y) =>
    set((s) => ({ savedPositions: { ...s.savedPositions, [hostid]: { x, y } } })),
  reset: () =>
    set({
      sessionId: null,
      zabbixVersion: null,
      graph: null,
      diff: null,
      selectedHost: null,
      selectedLink: null,
      savedPositions: {},
      error: null,
    }),
}));
