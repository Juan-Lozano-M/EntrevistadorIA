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
        <RadarChart data={data} outerRadius="70%">
          <PolarGrid />
          <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11 }} />
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
          <Radar dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.4} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
