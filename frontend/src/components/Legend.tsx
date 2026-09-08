import { DEVICE_LABELS, HEALTH_COLORS, HEALTH_LABELS, LINK_COLORS, LINK_LABELS } from "../lib/labels";
import { DEVICE_ICONS } from "../lib/icons";
import type { DeviceType, HealthState, LinkState } from "../types";

const healthOrder: HealthState[] = ["ok", "warning", "critical", "unavailable", "unknown"];
const linkOrder: LinkState[] = ["normal", "high_traffic", "problem", "errors", "down", "unavailable"];
const typeOrder: DeviceType[] = [
  "firewall",
  "router",
  "switch",
  "server",
  "vm",
  "workstation",
  "network",
  "printer",
  "other",
];

export function Legend() {
  return (
    <div className="legend" aria-label="Légende">
      <div className="legend__block">
        <h4>États</h4>
        <ul>
          {healthOrder.map((h) => (
            <li key={h}>
              <span className="swatch" style={{ background: HEALTH_COLORS[h] }} />
              {HEALTH_LABELS[h]}
            </li>
          ))}
        </ul>
      </div>
      <div className="legend__block">
        <h4>Liaisons</h4>
        <ul>
          {linkOrder.map((l) => (
            <li key={l}>
              <span className="swatch line" style={{ background: LINK_COLORS[l] }} />
              {LINK_LABELS[l]}
            </li>
          ))}
        </ul>
      </div>
      <div className="legend__block">
        <h4>Types</h4>
        <ul className="legend-types">
          {typeOrder.map((t) => {
            const Icon = DEVICE_ICONS[t];
            return (
              <li key={t}>
                <Icon size={14} />
                {DEVICE_LABELS[t]}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
