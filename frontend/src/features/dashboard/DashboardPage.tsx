import { Link } from "react-router-dom";
import { useHistory } from "@/features/interview/queries";
import { scoreBand } from "@/lib/dimensions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScoreRing } from "@/components/ScoreRing";
import { useAuthStore } from "@/stores/authStore";

const bandClass: Record<string, string> = {
  low: "text-destructive",
  mid: "text-amber-500",
  high: "text-green-600 dark:text-green-400",
};

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data: sessions, isLoading } = useHistory();
  const isEmpty = !isLoading && sessions && sessions.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Hola, {user?.name ?? ""}</h1>
          <p className="text-muted-foreground">Practica y mejora tus entrevistas.</p>
        </div>
        {!isEmpty && <Button asChild><Link to="/new">Nueva entrevista</Link></Button>}
      </div>

      {sessions && sessions.length > 0 && (() => {
        const finished = sessions.filter((s) => s.overallScore != null);
        const avg = finished.length
          ? Math.round(finished.reduce((sum, s) => sum + (s.overallScore ?? 0), 0) / finished.length)
          : 0;
        return (
          <Card>
            <CardContent className="flex items-center justify-around py-6">
              <ScoreRing value={avg} label="Promedio" />
              <div className="flex flex-col items-center gap-1">
                <span className="text-3xl font-bold text-primary">{sessions.length}</span>
                <span className="text-sm text-muted-foreground">Entrevistas</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-3xl font-bold text-primary">{finished.length}</span>
                <span className="text-sm text-muted-foreground">Completadas</span>
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {isLoading && <div className="grid gap-3 sm:grid-cols-2"><Skeleton className="h-24" /><Skeleton className="h-24" /></div>}

      {isEmpty && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-muted-foreground">Aún no tienes entrevistas. ¡Empieza la primera!</p>
            <Button asChild><Link to="/new">Nueva entrevista</Link></Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && sessions && sessions.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {sessions.map((s) => (
            <Link key={s.id} to={s.status === "FINISHED" ? `/results/${s.id}` : `/interview/${s.id}`}>
              <Card className="transition-colors hover:border-primary">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{s.roleTitle}</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{s.level} · {s.type}</span>
                  {s.overallScore != null
                    ? <span className={`text-xl font-bold ${bandClass[scoreBand(s.overallScore)]}`}>{s.overallScore}</span>
                    : <span className="text-sm text-muted-foreground">En progreso</span>}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
