import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { getStatsOverview } from "@/lib/api";
import { DIMENSION_LABELS, scoreBand } from "@/lib/dimensions";
import { ScoreRadar } from "@/components/ScoreRadar";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const RANGES = [
  { key: "7", label: "7 días", days: 7 },
  { key: "30", label: "30 días", days: 30 },
  { key: "all", label: "Todo", days: 0 },
] as const;

const bandBar: Record<string, string> = { low: "bg-destructive", mid: "bg-gold", high: "bg-green-500" };

export function ProgresoPage() {
  const { data, isLoading } = useQuery({ queryKey: ["overview"], queryFn: getStatsOverview });
  const [range, setRange] = useState<(typeof RANGES)[number]["key"]>("30");
  const [dim, setDim] = useState<string | null>(null);

  const points = useMemo(() => {
    const all = data?.timeline ?? [];
    const days = RANGES.find((r) => r.key === range)!.days;
    if (!days) return all;
    const cutoff = Date.now() - days * 86_400_000;
    return all.filter((p) => new Date(p.date).getTime() >= cutoff);
  }, [data, range]);

  const dims = Object.keys(data?.dimensionAverages ?? {});
  const activeDim = dim && dims.includes(dim) ? dim : dims[0] ?? null;

  const overallData = points.map((p, i) => ({ name: `#${i + 1}`, score: p.score }));
  const dimData = activeDim
    ? points.map((p, i) => ({ name: `#${i + 1}`, score: p.dimensionScores[activeDim] ?? 0 }))
    : [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-72" />
        <div className="grid gap-5 lg:grid-cols-2"><Skeleton className="h-72" /><Skeleton className="h-72" /></div>
      </div>
    );
  }

  const hasData = (data?.timeline.length ?? 0) > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold sm:text-3xl">Progreso</h1>
        <p className="mt-1 text-muted-foreground">Tu evolución por sesión y por competencia.</p>
      </div>

      {!hasData ? (
        <Card className="border-dashed">
          <CardContent className="py-20 text-center text-muted-foreground">
            Completa al menos una entrevista para ver tu progreso.
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Overall evolution */}
          <Card>
            <CardContent className="py-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-lg font-semibold">Evolución del puntaje global</h2>
                  <p className="text-sm text-muted-foreground">Puntaje global por sesión</p>
                </div>
                <div className="flex rounded-lg border border-border p-0.5">
                  {RANGES.map((r) => (
                    <button key={r.key} onClick={() => setRange(r.key)}
                      className={cn("rounded-md px-3 py-1 text-sm font-medium transition-colors",
                        range === r.key ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground")}>
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
              {overallData.length > 1 ? (
                <ChartArea data={overallData} />
              ) : (
                <p className="py-16 text-center text-sm text-muted-foreground">
                  No hay suficientes sesiones en este rango.
                </p>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {/* Radar */}
            <Card>
              <CardContent className="py-6">
                <h2 className="mb-2 font-display text-lg font-semibold">Mapa de competencias</h2>
                <ScoreRadar scores={data!.dimensionAverages} />
              </CardContent>
            </Card>

            {/* Per-dimension trend */}
            <Card>
              <CardContent className="py-6">
                <h2 className="font-display text-lg font-semibold">Tendencia por competencia</h2>
                <div className="my-4 flex flex-wrap gap-2">
                  {dims.map((d) => (
                    <button key={d} onClick={() => setDim(d)}
                      className={cn("rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                        activeDim === d ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:border-primary/50")}>
                      {DIMENSION_LABELS[d] ?? d}
                    </button>
                  ))}
                </div>
                {dimData.length > 1 ? (
                  <ChartLine data={dimData} />
                ) : (
                  <p className="py-12 text-center text-sm text-muted-foreground">
                    Necesitas más sesiones para ver la tendencia.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Competency bars */}
          <Card>
            <CardContent className="py-6">
              <h2 className="mb-4 font-display text-lg font-semibold">Competencias (promedio)</h2>
              <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
                {Object.entries(data!.dimensionAverages).map(([d, score]) => (
                  <div key={d}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span>{DIMENSION_LABELS[d] ?? d}</span>
                      <span className="font-mono font-semibold tabular">{score}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                      <div className={cn("h-full rounded-full", bandBar[scoreBand(score)])} style={{ width: `${score}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function ChartArea({ data }: { data: { name: string; score: number }[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: -24, right: 8, top: 4 }}>
          <defs>
            <linearGradient id="progFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
          <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
          <YAxis domain={[0, 100]} width={32} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
          <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
            labelStyle={{ color: "hsl(var(--muted-foreground))" }} />
          <Area dataKey="score" name="Puntaje" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#progFill)"
            dot={{ r: 2.5, fill: "hsl(var(--primary))" }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function ChartLine({ data }: { data: { name: string; score: number }[] }) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ left: -24, right: 8, top: 4 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
          <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
          <YAxis domain={[0, 100]} width={32} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
          <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
            labelStyle={{ color: "hsl(var(--muted-foreground))" }} />
          <Line dataKey="score" name="Puntaje" stroke="hsl(var(--gold))" strokeWidth={2} dot={{ r: 2.5, fill: "hsl(var(--gold))" }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
