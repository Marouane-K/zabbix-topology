import {
  LayoutGrid,
  RefreshCw,
  Save,
  Search,
  RotateCcw,
  Eye,
  EyeOff,
} from "lucide-react";
import { useAppStore } from "../store";
import type { DisplayMode } from "../types";
import { DEVICE_LABELS, HEALTH_LABELS } from "../lib/labels";

interface Props {
  onRefresh: () => void;
  onRelayout: () => void;
  onSave: () => void;
  onRestore: () => void;
  onDisconnect: () => void;
}

export function Toolbar({ onRefresh, onRelayout, onSave, onRestore, onDisconnect }: Props) {
  const graph = useAppStore((s) => s.graph);
  const prefs = useAppStore((s) => s.prefs);
  const setPrefs = useAppStore((s) => s.setPrefs);
  const searchQuery = useAppStore((s) => s.searchQuery);
  const setSearchQuery = useAppStore((s) => s.setSearchQuery);
  const groupFilter = useAppStore((s) => s.groupFilter);
  const setGroupFilter = useAppStore((s) => s.setGroupFilter);
  const typeFilter = useAppStore((s) => s.typeFilter);
  const setTypeFilter = useAppStore((s) => s.setTypeFilter);
  const healthFilter = useAppStore((s) => s.healthFilter);
  const setHealthFilter = useAppStore((s) => s.setHealthFilter);
  const zabbixVersion = useAppStore((s) => s.zabbixVersion);
  const diff = useAppStore((s) => s.diff);

  const groups = Array.from(new Set(graph?.hosts.flatMap((h) => h.groups) || [])).sort();

  return (
    <header className="toolbar">
      <div className="toolbar__brand">
        <LayoutGrid size={20} />
        <div>
          <strong>Zabbix Topology</strong>
          <span>
            {graph ? `${graph.hosts.length} équipements · ${graph.links.length} liaisons` : "—"}
            {zabbixVersion ? ` · Zabbix ${zabbixVersion}` : ""}
          </span>
        </div>
      </div>

      <div className="toolbar__search">
        <Search size={16} />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher un équipement…"
        />
      </div>

      <div className="toolbar__filters">
        <select value={groupFilter ?? ""} onChange={(e) => setGroupFilter(e.target.value || null)}>
          <option value="">Tous les groupes</option>
          {groups.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
        <select value={typeFilter ?? ""} onChange={(e) => setTypeFilter(e.target.value || null)}>
          <option value="">Tous les types</option>
          {Object.entries(DEVICE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <select value={healthFilter ?? ""} onChange={(e) => setHealthFilter(e.target.value || null)}>
          <option value="">Tous les états</option>
          {Object.entries(HEALTH_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <select
          value={prefs.mode}
          onChange={(e) => setPrefs({ mode: e.target.value as DisplayMode })}
          title="Mode d'affichage"
        >
          <option value="simple">Mode simple</option>
          <option value="supervision">Mode supervision</option>
          <option value="detailed">Mode détaillé</option>
        </select>
      </div>

      <div className="toolbar__actions">
        <button
          className="ghost"
          onClick={() => setPrefs({ showTraffic: !prefs.showTraffic })}
          title="Afficher / masquer le trafic"
        >
          {prefs.showTraffic ? <Eye size={16} /> : <EyeOff size={16} />}
          Trafic
        </button>
        <button className="ghost" onClick={onRefresh} title="Actualiser depuis Zabbix">
          <RefreshCw size={16} />
          Actualiser
        </button>
        <button className="ghost" onClick={onRelayout} title="Réorganiser automatiquement">
          <RotateCcw size={16} />
          Réorganiser
        </button>
        <button className="ghost" onClick={onSave} title="Sauvegarder la disposition">
          <Save size={16} />
          Sauver
        </button>
        <button className="primary" onClick={onRestore} title="Restaurer la dernière disposition">
          Restaurer
        </button>
        <button className="ghost" onClick={onDisconnect} title="Se déconnecter">
          Déconnexion
        </button>
      </div>

      {diff && (diff.added_hosts.length > 0 || diff.removed_hosts.length > 0 || diff.new_problems > 0) && (
        <div className="toolbar__diff">
          {diff.added_hosts.length > 0 && (
            <span>{diff.added_hosts.length} nouveau(x) équipement(s)</span>
          )}
          {diff.removed_hosts.length > 0 && (
            <span>{diff.removed_hosts.length} supprimé(s)</span>
          )}
          {diff.new_problems > 0 && <span>{diff.new_problems} nouveau(x) problème(s)</span>}
        </div>
      )}
    </header>
  );
}
