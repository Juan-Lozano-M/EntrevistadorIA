import { Link } from "react-router-dom";
import { ArrowUpRight, Plus, Trophy } from "lucide-react";
import { useHistory } from "@/features/interview/queries";
import { scoreBand } from "@/lib/dimensions";
import { levelLabel, typeLabel } from "@/lib/labels";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScoreRing } from "@/components/ScoreRing";
import { useAuthStore } from "@/stores/authStore";

const bandPill: Record<string, string> = {
  low: "bg-destructive/10 text-destructive",
  mid: "bg-gold/15 text-gold",
  high: "bg-green-500/15 text-green-600 dark:text-green-400",
};

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data: sessions, isLoading } = useHistory();
  const isEmpty = !isLoading && sessions && sessions.length === 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">Tu panel</p>
          <h1 className="text-3xl font-semibold">Hola, {user?.name ?? ""}</h1>
          <p className="mt-1 text-muted-foreground">Practica y mejora tus entrevistas.</p>
        </div>
        {!isEmpty && (
          <Button asChild size="lg">
            <Link to="/new"><Plus className="h-4 w-4" /> Nueva entrevista</Link>
          </Button>
        )}
      </div>

      {sessions && sessions.length > 0 && (() => {
        const finished = sessions.filter((s) => s.overallScore != null);
        const avg = finished.length
          ? Math.round(finished.reduce((sum, s) => sum + (s.overallScore ?? 0), 0) / finished.length)
          : 0;
        const best = finished.length
          ? Math.max(...finished.map((s) => s.overallScore ?? 0))
          : 0;
        return (
          <Card className="overflow-hidden rise">
            <CardContent className="grid items-center gap-6 py-7 sm:grid-cols-[auto_1fr]">
              <ScoreRing value={avg} label="Promedio" />
              <div className="grid grid-cols-3 gap-3 text-center">
                <Stat value={sessions.length} label="Entrevistas" />
                <Stat value={finished.length} label="Completadas" />
                <div className="rounded-lg bg-gold/10 px-2 py-4">
                  <div className="flex items-center justify-center gap-1.5 font-display text-3xl font-bold tabular text-gold">
                    <Trophy className="h-5 w-5" />{best}
                  </div>
                  <span className="text-sm text-muted-foreground">Mejor</span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-28" /><Skeleton className="h-28" />
        </div>
      )}

      {isEmpty && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-4 py-14 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-accent text-accent-foreground">
              <Plus className="h-6 w-6" />
            </span>
            <p className="text-muted-foreground">Aún no tienes entrevistas. ¡Empieza la primera!</p>
            <Button asChild><Link to="/new">Nueva entrevista</Link></Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && sessions && sessions.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Historial</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {sessions.map((s) => {
              const finished = s.overallScore != null;
              return (
                <Link key={s.id} to={finished ? `/results/${s.id}` : `/interview/${s.id}`} className="group">
                  <Card className="h-full transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md">
                    <CardContent className="flex h-full items-center justify-between gap-4 py-5">
                      <div className="min-w-0">
                        <p className="truncate font-display text-lg font-semibold">{s.roleTitle}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {levelLabel(s.level)} · {typeLabel(s.type)}
                        </p>
                      </div>
                      {finished ? (
                        <span className={`shrink-0 rounded-full px-3 py-1 font-display text-lg font-bold tabular ${bandPill[scoreBand(s.overallScore!)]}`}>
                          {s.overallScore}
                        </span>
                      ) : (
                        <span className="inline-flex shrink-0 items-center gap-1 text-sm text-muted-foreground">
                          En progreso <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </span>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-lg bg-secondary px-2 py-4">
      <div className="font-display text-3xl font-bold tabular">{value}</div>
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  );
}
