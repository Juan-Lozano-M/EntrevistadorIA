import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import { DIMENSION_LABELS } from "@/lib/dimensions";

export function ScoreRadar({ scores }: { scores: Record<string, number> }) {
  const data = Object.entries(scores).map(([dim, value]) => ({
    dimension: DIMENSION_LABELS[dim] ?? dim,
    value,
  }));
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="68%">
          <PolarGrid stroke="hsl(var(--border))" />
          <PolarAngleAxis
            dataKey="dimension"
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          />
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            dataKey="value"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fill="hsl(var(--primary))"
            fillOpacity={0.22}
            dot={{ r: 2.5, fill: "hsl(var(--primary))" }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
