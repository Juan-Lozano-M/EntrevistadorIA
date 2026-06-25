import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Award, TrendingUp, AlertTriangle, Lightbulb, ListChecks, Sprout, ThumbsUp, Trophy } from "lucide-react";
import { useResults } from "@/features/interview/queries";
import { ScoreRadar } from "@/components/ScoreRadar";
import { ScoreRing } from "@/components/ScoreRing";
import { levelLabel, typeLabel } from "@/lib/labels";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const TIERS = [
  { min: 85, label: "Sobresaliente", title: "¡Excelente desempeño!", message: "Dominas la entrevista. Mantén este nivel.", icon: Trophy, tone: "text-green-600 dark:text-green-400", bg: "bg-green-500/15" },
  { min: 70, label: "Notable", title: "Muy buen desempeño", message: "Vas muy bien; afina los detalles finos.", icon: Award, tone: "text-green-600 dark:text-green-400", bg: "bg-green-500/15" },
  { min: 55, label: "Sólido", title: "Vas por buen camino", message: "Buena base; pule tus puntos débiles.", icon: ThumbsUp, tone: "text-gold", bg: "bg-gold/15" },
  { min: 40, label: "En desarrollo", title: "Sigue construyendo", message: "Buen punto de partida; refuerza lo esencial.", icon: TrendingUp, tone: "text-gold", bg: "bg-gold/15" },
  { min: 0, label: "Por mejorar", title: "Hay margen de mejora", message: "Sigue practicando; cada intento suma.", icon: Sprout, tone: "text-destructive", bg: "bg-destructive/10" },
] as const;

function tierFor(score: number) {
  return TIERS.find((t) => score >= t.min) ?? TIERS[TIERS.length - 1];
}

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
        <Button asChild variant="outline"><Link to="/app">Volver</Link></Button>
      </div>
    );
  }

  const tier = tierFor(data.overallScore ?? 0);
  const TierIcon = tier.icon;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link to="/app" className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
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
          <CardContent className="flex flex-col items-center gap-4 py-8">
            <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold", tier.bg, tier.tone)}>
              <TierIcon className="h-3.5 w-3.5" /> {tier.label}
            </span>
            <ScoreRing value={data.overallScore ?? 0} label="Puntaje global" />
            <div className="text-center">
              <p className={cn("font-display text-lg font-semibold", tier.tone)}>{tier.title}</p>
              <p className="mt-1 max-w-xs text-sm text-muted-foreground">{tier.message}</p>
            </div>
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

      {data.answers.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Tus respuestas vs. respuesta modelo</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {data.answers.map((a) => (
              <div key={a.questionId} className="rounded-lg border border-border bg-secondary/30 p-4">
                <p className="font-medium">{a.questionText}</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-md bg-background p-3">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tu respuesta</p>
                    <p className="text-sm">{a.answerText}</p>
                  </div>
                  <div className="rounded-md bg-accent/40 p-3">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary">Modelo</p>
                    <p className="text-sm">{a.modelAnswer}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
