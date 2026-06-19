import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Award, TrendingUp, AlertTriangle, Lightbulb, ListChecks } from "lucide-react";
import { useResults } from "@/features/interview/queries";
import { ScoreRadar } from "@/components/ScoreRadar";
import { ScoreRing } from "@/components/ScoreRing";
import { scoreBand } from "@/lib/dimensions";
import { levelLabel, typeLabel } from "@/lib/labels";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const verdict: Record<string, string> = {
  low: "Hay buen margen de mejora — sigue practicando.",
  mid: "Vas por buen camino. Pule los puntos débiles.",
  high: "Gran desempeño. Mantén el nivel.",
};

const feedbackSections = [
  { key: "strengths", title: "Fortalezas", icon: TrendingUp, tone: "text-green-600 dark:text-green-400", dot: "bg-green-500" },
  { key: "weaknesses", title: "Debilidades", icon: AlertTriangle, tone: "text-destructive", dot: "bg-destructive" },
  { key: "recommendations", title: "Recomendaciones", icon: Lightbulb, tone: "text-primary", dot: "bg-primary" },
  { key: "improvementPlan", title: "Plan de mejora", icon: ListChecks, tone: "text-gold", dot: "bg-gold" },
] as const;

export function ResultsPage() {
  const { id } = useParams();
  const { data, isLoading, isError } = useResults(Number(id));

  if (isLoading) return <Skeleton className="h-96" />;
  if (isError || !data) {
    return (
      <div className="space-y-4 py-10 text-center">
        <p className="text-muted-foreground">
          No se pudieron cargar los resultados. La entrevista podría no haber finalizado todavía.
        </p>
        <Button asChild variant="outline"><Link to="/">Volver</Link></Button>
      </div>
    );
  }

  const band = scoreBand(data.overallScore ?? 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link to="/" className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Volver al panel
          </Link>
          <h1 className="text-3xl font-semibold">{data.roleTitle}</h1>
          <p className="mt-1 text-muted-foreground">{levelLabel(data.level)} · {typeLabel(data.type)}</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-gold/12 px-3 py-1.5 text-sm font-medium text-gold">
          <Award className="h-4 w-4" /> Reporte de desempeño
        </span>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="rise overflow-hidden">
          <CardContent className="flex flex-col items-center gap-3 py-8">
            <ScoreRing value={data.overallScore ?? 0} label="Puntaje global" />
            <p className="max-w-xs text-center text-sm text-muted-foreground">{verdict[band]}</p>
          </CardContent>
        </Card>
        <Card className="rise">
          <CardHeader><CardTitle className="text-base">Dimensiones evaluadas</CardTitle></CardHeader>
          <CardContent><ScoreRadar scores={data.dimensionScores} /></CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {feedbackSections.map(({ key, title, icon: Icon, tone, dot }) => {
          const items = data.feedback[key];
          if (!items || items.length === 0) return null;
          return (
            <Card key={key}>
              <CardContent className="py-5">
                <h3 className={`mb-3 flex items-center gap-2 font-display font-semibold ${tone}`}>
                  <Icon className="h-4 w-4" /> {title}
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {items.map((it, i) => (
                    <li key={i} className="flex gap-2">
                      <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
                      {it}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Tus respuestas vs. respuesta modelo</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {data.answers.map((a) => (
            <div key={a.questionId} className="rounded-lg border border-border bg-secondary/30 p-4">
              <p className="font-medium">{a.questionText}</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="rounded-md bg-background p-3">
                  <p className="mb-1 font-mono text-xs uppercase tracking-wide text-muted-foreground">Tu respuesta</p>
                  <p className="text-sm">{a.answerText}</p>
                </div>
                <div className="rounded-md bg-accent/40 p-3">
                  <p className="mb-1 font-mono text-xs uppercase tracking-wide text-primary">Modelo</p>
                  <p className="text-sm">{a.modelAnswer}</p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
