import { ScoreRing } from "@/components/ScoreRing";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useHistory } from "@/features/interview/queries";
import { getStatsOverview } from "@/lib/api";
import { DIMENSION_LABELS, scoreBand } from "@/lib/dimensions";
import { levelLabel, typeLabel } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  CheckCircle2,
  ClipboardList,
  Crown,
  MessageSquare,
  Plus,
  Target,
  Trophy,
} from "lucide-react";
import { type ComponentType } from "react";
import { Link } from "react-router-dom";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const bandPill: Record<string, string> = {
  low: "bg-destructive/10 text-destructive",
  mid: "bg-gold/15 text-gold",
  high: "bg-green-500/15 text-green-600 dark:text-green-400",
};

const bandBar: Record<string, string> = {
  low: "bg-destructive",
  mid: "bg-gold",
  high: "bg-green-500",
};

function greeting(): string {
  const h = new Date().getHours();
  return h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";
}

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const isPremium = user?.plan === "PREMIUM";

  const overview = useQuery({
    queryKey: ["overview"],
    queryFn: getStatsOverview,
  });
  const history = useHistory();


  const o = overview.data;
  const recent = (history.data ?? []).slice(0, 5);
  const chartData = (o?.timeline ?? []).map((p, i) => ({
    name: `#${i + 1}`,
    score: p.score,
  }));
  const dims = Object.entries(o?.dimensionAverages ?? {});

  return (
    <div className="space-y-6">
      {/* Greeting + actions */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold sm:text-3xl">
            {greeting()}, {user?.name ?? ""}{" "}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Practica y mejora tus entrevistas.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!isPremium && (
            <Button asChild variant="outline" className="border-gold/40 text-gold hover:bg-gold/10">
              <Link to="/precios">
                <Crown className="h-4 w-4" /> Mejorar
              </Link>
            </Button>
          )}
          <Button asChild>
            <Link to="/new">
              <Plus className="h-4 w-4" /> Nueva entrevista
            </Link>
          </Button>
        </div>
      </div>

      {overview.isLoading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : o && o.total === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-accent text-accent-foreground">
              <Plus className="h-7 w-7" />
            </span>
            <p className="font-display text-lg font-semibold">
              Aún no tienes entrevistas. ¡Empieza la primera!
            </p>
            <Button asChild size="lg">
              <Link to="/new">Nueva entrevista</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              icon={CheckCircle2}
              value={o?.completed ?? 0}
              label="Entrevistas completadas"
            />
            <StatCard
              icon={Target}
              value={o?.average ?? 0}
              label="Puntaje promedio"
            />
            <StatCard
              icon={Trophy}
              value={o?.best ?? 0}
              label="Mejor puntaje"
              gold
            />
            <StatCard
              icon={ClipboardList}
              value={o?.total ?? 0}
              label="Total de sesiones"
            />
          </div>

          {/* Chart + average */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardContent className="py-6">
                <div className="mb-4">
                  <h2 className="font-display text-lg font-semibold">
                    Evolución de desempeño
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Puntaje global por sesión
                  </p>
                </div>
                {chartData.length > 1 ? (
                  <div className="h-60 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={chartData}
                        margin={{ left: -24, right: 8, top: 4 }}
                      >
                        <defs>
                          <linearGradient
                            id="scoreFill"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="hsl(var(--primary))"
                              stopOpacity={0.35}
                            />
                            <stop
                              offset="100%"
                              stopColor="hsl(var(--primary))"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="hsl(var(--border))"
                        />
                        <XAxis
                          dataKey="name"
                          tickLine={false}
                          axisLine={false}
                          tick={{
                            fontSize: 11,
                            fill: "hsl(var(--muted-foreground))",
                          }}
                        />
                        <YAxis
                          domain={[0, 100]}
                          width={32}
                          tickLine={false}
                          axisLine={false}
                          tick={{
                            fontSize: 11,
                            fill: "hsl(var(--muted-foreground))",
                          }}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: 12,
                            fontSize: 12,
                          }}
                          labelStyle={{ color: "hsl(var(--muted-foreground))" }}
                        />
                        <Area
                          dataKey="score"
                          name="Puntaje"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          fill="url(#scoreFill)"
                          dot={{ r: 2.5, fill: "hsl(var(--primary))" }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="py-16 text-center text-sm text-muted-foreground">
                    Completa al menos dos entrevistas para ver tu evolución.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex h-full flex-col items-center justify-center gap-2 py-6">
                <ScoreRing value={o?.average ?? 0} label="Promedio" />
                <p className="text-center text-sm text-muted-foreground">
                  Mejor puntaje:{" "}
                  <span className="font-semibold text-gold">
                    {o?.best ?? 0}
                  </span>
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Competencias + recientes */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardContent className="py-6">
                <h2 className="mb-4 font-display text-lg font-semibold">
                  Competencias
                </h2>
                {dims.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Aún no hay datos de competencias. Completa una entrevista.
                  </p>
                ) : (
                  <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
                    {dims.map(([dim, score]) => (
                      <div key={dim}>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span>{DIMENSION_LABELS[dim] ?? dim}</span>
                          <span className="font-mono font-semibold tabular">
                            {score}
                          </span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              bandBar[scoreBand(score)],
                            )}
                            style={{ width: `${score}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="py-6">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="font-display text-lg font-semibold">
                    Recientes
                  </h2>
                  <Link
                    to="/app/entrevistas"
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Ver historial
                  </Link>
                </div>
                {recent.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    Sin entrevistas aún.
                  </p>
                ) : (
                  <div className="space-y-1">
                    {recent.map((s) => {
                      const finished = s.overallScore != null;
                      const isChat = s.modality === "CHAT";
                      const to = finished
                        ? `/results/${s.id}`
                        : isChat
                          ? `/chat/${s.id}`
                          : `/interview/${s.id}`;
                      return (
                        <Link
                          key={s.id}
                          to={to}
                          className="group flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-secondary"
                        >
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-secondary text-muted-foreground">
                            {isChat ? (
                              <MessageSquare className="h-4 w-4" />
                            ) : (
                              <ClipboardList className="h-4 w-4" />
                            )}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {s.roleTitle}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {levelLabel(s.level)} · {typeLabel(s.type)}
                            </p>
                          </div>
                          {finished ? (
                            <span
                              className={cn(
                                "shrink-0 rounded-full px-2 py-0.5 font-mono text-sm font-semibold tabular",
                                bandPill[scoreBand(s.overallScore!)],
                              )}
                            >
                              {s.overallScore}
                            </span>
                          ) : (
                            <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  value,
  label,
  gold,
}: {
  icon: ComponentType<{ className?: string }>;
  value: number;
  label: string;
  gold?: boolean;
}) {
  return (
    <Card>
      <CardContent className="py-5">
        <span
          className={cn(
            "grid h-10 w-10 place-items-center rounded-xl",
            gold ? "bg-gold/15 text-gold" : "bg-accent text-accent-foreground",
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div
          className={cn(
            "mt-4 font-mono text-3xl font-semibold tabular",
            gold && "text-gold",
          )}
        >
          {value}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
