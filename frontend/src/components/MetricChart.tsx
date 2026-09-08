import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { api } from "../api";
import { useAppStore } from "../store";

interface MetricChartProps {
  itemid: string | null;
  itemName: string;
  units?: string | null;
  height?: number;
}

interface DataPoint {
  clock: string;
  value: number;
}

export function MetricChart({ itemid, itemName, units, height = 200 }: MetricChartProps) {
  const [data, setData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!itemid) {
      setData([]);
      return;
    }

    setLoading(true);
    setError(null);

    const fetchData = async () => {
      const sessionId = useAppStore.getState().sessionId;
      if (!sessionId) {
        setError("Session non disponible");
        setLoading(false);
        return;
      }
      try {
        const response = await api.history(sessionId, itemid, 1);
        const points = response.points.map((p: any) => ({
          clock: new Date(p.clock * 1000).toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          value: p.value,
        }));
        setData(points);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur de chargement");
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [itemid]);

  if (!itemid) {
    return (
      <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span className="muted">Sélectionnez une métrique</span>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span className="muted">Chargement...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span className="muted" style={{ color: "var(--danger)" }}>{error}</span>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span className="muted">Aucune donnée disponible</span>
      </div>
    );
  }

  const formatValue = (value: number) => {
    if (units === "bps") {
      if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)} Gbps`;
      if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} Mbps`;
      if (value >= 1_000) return `${(value / 1_000).toFixed(1)} Kbps`;
      return `${value.toFixed(1)} bps`;
    }
    if (units === "%") return `${value.toFixed(1)}%`;
    return value.toFixed(2);
  };

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
          <XAxis
            dataKey="clock"
            tick={{ fontSize: 10, fill: "var(--muted)" }}
            axisLine={{ stroke: "var(--line)" }}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "var(--muted)" }}
            tickFormatter={formatValue}
            axisLine={{ stroke: "var(--line)" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--surface-2)",
              border: "1px solid var(--line)",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            formatter={(value: any) => [formatValue(value), itemName]}
            labelStyle={{ color: "var(--ink)" }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="var(--accent)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "var(--accent)" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
