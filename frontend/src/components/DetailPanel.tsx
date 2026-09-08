import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Clock,
  Cpu,
  HardDrive,
  MemoryStick,
  Network,
  Server,
  X,
} from "lucide-react";
import { useAppStore } from "../store";
import { DEVICE_LABELS, HEALTH_LABELS, LINK_LABELS, formatBps } from "../lib/labels";
import { DEVICE_ICONS } from "../lib/icons";
import { MetricChart } from "./MetricChart";

export function DetailPanel() {
  const selectedHost = useAppStore((s) => s.selectedHost);
  const selectedLink = useAppStore((s) => s.selectedLink);
  const setSelectedHost = useAppStore((s) => s.setSelectedHost);
  const setSelectedLink = useAppStore((s) => s.setSelectedLink);
  const [tab, setTab] = useState<"general" | "metrics" | "interfaces">("general");

  const open = Boolean(selectedHost || selectedLink);

  const Icon = useMemo(() => {
    if (!selectedHost) return Server;
    return DEVICE_ICONS[selectedHost.device_type] || Server;
  }, [selectedHost]);

  if (!open) return null;

  const getProgressColor = (value: number | null) => {
    if (value == null) return "var(--muted)";
    if (value >= 90) return "var(--danger)";
    if (value >= 75) return "var(--warn)";
    return "var(--ok)";
  };

  const ProgressBar = ({ value, label, icon: Icon }: { value: number | null; label: string; icon: any }) => (
    <div className="progress-bar-container">
      <div className="progress-bar-header">
        <Icon size={14} />
        <span>{label}</span>
        <span className="progress-value">{value != null ? `${value.toFixed(1)}%` : "—"}</span>
      </div>
      <div className="progress-bar-track">
        <div
          className="progress-bar-fill"
          style={{
            width: value != null ? `${Math.min(100, value)}%` : "0%",
            backgroundColor: getProgressColor(value),
          }}
        />
      </div>
    </div>
  );

  return (
    <aside className="detail-panel" aria-label="Détails">
      <div className="detail-panel__header">
        <div className="detail-panel__title-row">
          {selectedHost && (
            <>
              <div className={`detail-icon health-${selectedHost.health}`}>
                <Icon size={22} />
              </div>
              <div>
                <h2>{selectedHost.name}</h2>
                <p>{DEVICE_LABELS[selectedHost.device_type]} · {HEALTH_LABELS[selectedHost.health]}</p>
              </div>
            </>
          )}
          {selectedLink && !selectedHost && (
            <>
              <div className="detail-icon health-ok">
                <Network size={22} />
              </div>
              <div>
                <h2>Liaison</h2>
                <p>{LINK_LABELS[selectedLink.state]}</p>
              </div>
            </>
          )}
        </div>
        <button
          className="icon-btn"
          onClick={() => {
            setSelectedHost(null);
            setSelectedLink(null);
          }}
          aria-label="Fermer"
        >
          <X size={18} />
        </button>
      </div>

      {selectedHost && (
        <>
          <div className="detail-tabs">
            <button className={tab === "general" ? "active" : ""} onClick={() => setTab("general")}>
              Général
            </button>
            <button className={tab === "metrics" ? "active" : ""} onClick={() => setTab("metrics")}>
              Ressources
            </button>
            <button className={tab === "interfaces" ? "active" : ""} onClick={() => setTab("interfaces")}>
              Interfaces
            </button>
          </div>

          <div className="detail-body">
            {tab === "general" && (
              <>
                <section>
                  <h3>Informations</h3>
                  <dl className="kv">
                    <div><dt>Nom technique</dt><dd>{selectedHost.host}</dd></div>
                    <div><dt>Adresse IP</dt><dd>{selectedHost.ip || "—"}</dd></div>
                    <div><dt>Disponibilité</dt><dd>{selectedHost.available ?? "—"}</dd></div>
                    <div><dt>Statut</dt><dd>{selectedHost.status === 0 ? "Activé" : "Désactivé"}</dd></div>
                  </dl>
                </section>

                {selectedHost.description && (
                  <section>
                    <h3>Description</h3>
                    <p className="muted">{selectedHost.description}</p>
                  </section>
                )}

                <section>
                  <h3>
                    <Activity size={14} /> Temps réel
                  </h3>
                  <div className="live-metrics">
                    <ProgressBar
                      value={selectedHost.live?.cpu_pct}
                      label="CPU"
                      icon={Cpu}
                    />
                    <ProgressBar
                      value={selectedHost.live?.mem_pct}
                      label="Mémoire"
                      icon={MemoryStick}
                    />
                    <ProgressBar
                      value={selectedHost.live?.disk_pct}
                      label="Disque /"
                      icon={HardDrive}
                    />
                    <div className="metric-row">
                      <Network size={14} />
                      <span>Trafic ↓</span>
                      <span>{formatBps(selectedHost.live?.net_in_bps)}</span>
                    </div>
                    <div className="metric-row">
                      <Network size={14} />
                      <span>Trafic ↑</span>
                      <span>{formatBps(selectedHost.live?.net_out_bps)}</span>
                    </div>
                    {selectedHost.live?.icmp_latency_sec != null && (
                      <div className="metric-row">
                        <Activity size={14} />
                        <span>Latence ICMP</span>
                        <span>{(selectedHost.live.icmp_latency_sec * 1000).toFixed(1)} ms</span>
                      </div>
                    )}
                    {selectedHost.live?.icmp_loss_pct != null && (
                      <div className="metric-row">
                        <AlertTriangle size={14} />
                        <span>Perte ICMP</span>
                        <span>{selectedHost.live.icmp_loss_pct.toFixed(1)}%</span>
                      </div>
                    )}
                  </div>
                </section>

                <section>
                  <h3>Groupes</h3>
                  <div className="chips">
                    {selectedHost.groups.length ? selectedHost.groups.map((g) => <span key={g}>{g}</span>) : <span className="muted">Aucun</span>}
                  </div>
                </section>

                <section>
                  <h3>Templates</h3>
                  <div className="chips">
                    {selectedHost.templates.length ? selectedHost.templates.map((t) => <span key={t}>{t}</span>) : <span className="muted">Aucun</span>}
                  </div>
                </section>

                <section>
                  <h3>
                    <AlertTriangle size={14} /> Problèmes actifs
                  </h3>
                  {selectedHost.problems.length === 0 ? (
                    <p className="muted">Aucun problème actif</p>
                  ) : (
                    <ul className="problem-list">
                      {selectedHost.problems.map((p) => (
                        <li key={p.eventid} className={`sev-${p.severity}`}>
                          <strong>S{p.severity}</strong> {p.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </>
            )}

            {tab === "metrics" && (
              <section>
                <h3>
                  <Cpu size={14} /> Métriques
                </h3>
                {selectedHost.metrics.length === 0 ? (
                  <p className="muted">Aucune métrique pertinente exposée par Zabbix pour cet hôte.</p>
                ) : (
                  <>
                    <ul className="metric-list">
                      {selectedHost.metrics.slice(0, 5).map((m) => (
                        <li key={m.key}>
                          <div className="metric-name">{m.name}</div>
                          <div className="metric-value">
                            {m.value ?? "—"} {m.units || ""}
                          </div>
                          <div className="metric-key">{m.key}</div>
                        </li>
                      ))}
                    </ul>
                    {selectedHost.metrics.length > 5 && (
                      <p className="muted">...et {selectedHost.metrics.length - 5} autres métriques</p>
                    )}
                    <section style={{ marginTop: "20px" }}>
                      <h4>Historique (dernière heure)</h4>
                      {selectedHost.metrics[0]?.itemid && (
                        <MetricChart
                          itemid={selectedHost.metrics[0].itemid}
                          itemName={selectedHost.metrics[0].name}
                          units={selectedHost.metrics[0].units}
                          height={180}
                        />
                      )}
                    </section>
                  </>
                )}
              </section>
            )}

            {tab === "interfaces" && (
              <section>
                <h3>
                  <Activity size={14} /> Interfaces
                </h3>
                {selectedHost.interfaces.length === 0 ? (
                  <p className="muted">Aucune interface déclarée</p>
                ) : (
                  <ul className="iface-list">
                    {selectedHost.interfaces.map((iface) => (
                      <li key={iface.interfaceid}>
                        <div className="iface-top">
                          <strong>{iface.name || `if-${iface.interfaceid}`}</strong>
                          <span className={`dot av-${iface.available ?? 0}`} />
                        </div>
                        <div className="muted">
                          {iface.ip || iface.dns || "—"} · type {iface.type ?? "?"}
                          {iface.main ? " · principale" : ""}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}
          </div>
        </>
      )}

      {selectedLink && !selectedHost && (
        <div className="detail-body">
          <section>
            <h3>Liaison</h3>
            <dl className="kv">
              <div><dt>Source</dt><dd>{selectedLink.source_hostid}</dd></div>
              <div><dt>Destination</dt><dd>{selectedLink.target_hostid}</dd></div>
              <div><dt>Interface source</dt><dd>{selectedLink.source_interface || "—"}</dd></div>
              <div><dt>Interface dest.</dt><dd>{selectedLink.target_interface || "—"}</dd></div>
              <div><dt>Type</dt><dd>{selectedLink.link_type}</dd></div>
              <div><dt>État</dt><dd>{LINK_LABELS[selectedLink.state]}</dd></div>
            </dl>
          </section>
          <section>
            <h3>Trafic</h3>
            <dl className="kv">
              <div><dt>Entrant</dt><dd>{formatBps(selectedLink.in_bps)}</dd></div>
              <div><dt>Sortant</dt><dd>{formatBps(selectedLink.out_bps)}</dd></div>
              <div><dt>Débit max</dt><dd>{formatBps(selectedLink.bandwidth_bps)}</dd></div>
              <div>
                <dt>Utilisation</dt>
                <dd>{selectedLink.utilization_pct != null ? `${selectedLink.utilization_pct}%` : "—"}</dd>
              </div>
            </dl>
          </section>
          <section>
            <h3>
              <Clock size={14} /> Preuve
            </h3>
            <p className="muted">{selectedLink.evidence}</p>
          </section>
        </div>
      )}
    </aside>
  );
}
