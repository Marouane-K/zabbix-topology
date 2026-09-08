import type { DeviceType, HealthState, LinkState } from "../types";

export const DEVICE_LABELS: Record<DeviceType, string> = {
  server: "Serveur",
  workstation: "Ordinateur",
  vm: "Machine virtuelle",
  router: "Routeur",
  switch: "Switch",
  firewall: "Firewall",
  network: "Équipement réseau",
  printer: "Imprimante",
  other: "Autre",
};

export const HEALTH_LABELS: Record<HealthState, string> = {
  ok: "Disponible",
  warning: "Avertissement",
  critical: "Problème",
  unavailable: "Indisponible",
  unknown: "Inconnu",
};

export const HEALTH_COLORS: Record<HealthState, string> = {
  ok: "#1f9d6a",
  warning: "#d97706",
  critical: "#dc2626",
  unavailable: "#7f1d1d",
  unknown: "#64748b",
};

export const LINK_COLORS: Record<LinkState, string> = {
  normal: "#5b6b7c",
  high_traffic: "#c2410c",
  errors: "#b45309",
  down: "#991b1b",
  problem: "#be123c",
  unavailable: "#94a3b8",
};

export const LINK_LABELS: Record<LinkState, string> = {
  normal: "Liaison normale",
  high_traffic: "Trafic élevé",
  errors: "Erreurs",
  down: "Indisponible",
  problem: "Problème détecté",
  unavailable: "Données indisponibles",
};

export function formatBps(value?: number | null): string {
  if (value == null || Number.isNaN(value)) return "—";
  const units = ["bps", "Kbps", "Mbps", "Gbps", "Tbps"];
  let v = value;
  let i = 0;
  while (v >= 1000 && i < units.length - 1) {
    v /= 1000;
    i += 1;
  }
  return `${v.toFixed(v >= 100 ? 0 : 1)} ${units[i]}`;
}

export function utilizationBand(
  pct: number | null | undefined,
  thresholds: { normal_max: number; high_max: number; warning_max: number },
): "normal" | "high" | "warning" | "critical" | "unknown" {
  if (pct == null) return "unknown";
  if (pct < thresholds.normal_max) return "normal";
  if (pct < thresholds.high_max) return "high";
  if (pct < thresholds.warning_max) return "warning";
  return "critical";
}
