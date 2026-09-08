import { useCallback, useEffect, useState } from "react";
import { ConnectScreen } from "./components/ConnectScreen";
import { DetailPanel } from "./components/DetailPanel";
import { Legend } from "./components/Legend";
import { Toolbar } from "./components/Toolbar";
import { TopologyCanvas } from "./components/TopologyCanvas";
import LandingPage from "./components/LandingPage";
import { api } from "./api";
import { useAppStore } from "./store";
import type { DisplayPrefs } from "./types";

export default function App() {
  const sessionId = useAppStore((s) => s.sessionId);
  const setSession = useAppStore((s) => s.setSession);
  const setGraph = useAppStore((s) => s.setGraph);
  const setLoading = useAppStore((s) => s.setLoading);
  const setError = useAppStore((s) => s.setError);
  const error = useAppStore((s) => s.error);
  const loading = useAppStore((s) => s.loading);
  const savedPositions = useAppStore((s) => s.savedPositions);
  const setSavedPositions = useAppStore((s) => s.setSavedPositions);
  const prefs = useAppStore((s) => s.prefs);
  const setPrefs = useAppStore((s) => s.setPrefs);
  const reset = useAppStore((s) => s.reset);

  const [relayoutTick, setRelayoutTick] = useState(0);
  const [showLanding, setShowLanding] = useState(true);

  const loadTopology = useCallback(async (sid: string) => {
    setLoading(true);
    setError(null);
    try {
      const { graph, diff } = await api.topology(sid);
      setGraph(graph, diff);
      const current = useAppStore.getState().selectedHost;
      if (current) {
        const updated = graph.hosts.find((h) => h.hostid === current.hostid) || null;
        useAppStore.getState().setSelectedHost(updated);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de charger la topologie");
    } finally {
      setLoading(false);
    }
  }, [setError, setGraph, setLoading]);

  const handleConnected = useCallback(
    async (sid: string, version: string) => {
      setSession(sid, version);
      try {
        const { layout, preferences } = await api.getLayout(sid);
        if (layout?.nodes?.length) {
          const positions: Record<string, { x: number; y: number }> = {};
          for (const n of layout.nodes) positions[n.hostid] = { x: n.x, y: n.y };
          setSavedPositions(positions);
        }
        if (preferences) {
          const next: Partial<DisplayPrefs> = {};
          if (preferences.display_mode) next.mode = preferences.display_mode as DisplayPrefs["mode"];
          if (preferences.thresholds) next.thresholds = preferences.thresholds as DisplayPrefs["thresholds"];
          if (typeof preferences.show_traffic === "boolean") next.showTraffic = preferences.show_traffic;
          if (typeof preferences.show_ips === "boolean") next.showIps = preferences.show_ips;
          setPrefs(next);
        }
      } catch {
        /* first run — no layout yet */
      }
      await loadTopology(sid);
    },
    [loadTopology, setPrefs, setSavedPositions, setSession],
  );

  useEffect(() => {
    if (!sessionId) return;
    const timer = window.setInterval(() => {
      void loadTopology(sessionId);
    }, 15_000);
    return () => window.clearInterval(timer);
  }, [sessionId, loadTopology]);

  const handleSave = async () => {
    if (!sessionId) return;
    try {
      await api.saveLayout(sessionId, {
        nodes: Object.entries(savedPositions).map(([hostid, p]) => ({
          hostid,
          x: p.x,
          y: p.y,
        })),
        display: {
          mode: prefs.mode,
          showTraffic: prefs.showTraffic,
          showIps: prefs.showIps,
        },
        preferences: {
          display_mode: prefs.mode,
          show_traffic: prefs.showTraffic,
          show_ips: prefs.showIps,
          thresholds: prefs.thresholds,
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de sauvegarde");
    }
  };

  const handleRestore = async () => {
    if (!sessionId) return;
    try {
      const { layout } = await api.getLayout(sessionId);
      if (!layout?.nodes?.length) {
        setError("Aucune disposition sauvegardée");
        return;
      }
      const positions: Record<string, { x: number; y: number }> = {};
      for (const n of layout.nodes) positions[n.hostid] = { x: n.x, y: n.y };
      setSavedPositions(positions);
      setRelayoutTick((t) => t + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de restauration");
    }
  };

  if (showLanding) {
    return <LandingPage onContinue={() => setShowLanding(false)} />;
  }

  if (!sessionId) {
    return <ConnectScreen onConnected={handleConnected} />;
  }

  return (
    <div className="app-shell">
      <Toolbar
        onRefresh={() => void loadTopology(sessionId)}
        onRelayout={() => {
          setSavedPositions({});
          setRelayoutTick((t) => t + 1);
        }}
        onSave={() => void handleSave()}
        onRestore={() => void handleRestore()}
        onDisconnect={async () => {
          try {
            await api.disconnect(sessionId);
          } catch {
            /* ignore */
          }
          reset();
        }}
      />
      <div className="workspace">
        <main className="canvas-wrap">
          {loading && <div className="toast info">Synchronisation Zabbix…</div>}
          {error && (
            <div className="toast error" onClick={() => setError(null)}>
              {error}
            </div>
          )}
          <TopologyCanvas onRelayoutRequest={relayoutTick} />
          <Legend />
        </main>
        <DetailPanel />
      </div>
    </div>
  );
}
