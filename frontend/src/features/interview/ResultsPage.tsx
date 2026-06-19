import { useParams, Link } from "react-router-dom";
import { useResults } from "@/features/interview/queries";
import { ScoreRadar } from "@/components/ScoreRadar";
import { scoreBand } from "@/lib/dimensions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const bandClass: Record<string, string> = {
  low: "text-destructive", mid: "text-amber-500", high: "text-green-600 dark:text-green-400",
};

function FeedbackList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <h3 className="mb-2 font-medium">{title}</h3>
      <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
        {items.map((it, i) => <li key={i}>{it}</li>)}
      </ul>
    </div>
  );
}

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{data.roleTitle}</h1>
          <p className="text-muted-foreground">{data.level} · {data.type}</p>
        </div>
        <Button asChild variant="outline"><Link to="/">Volver</Link></Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Puntaje global</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-center py-8">
            <span className={`text-6xl font-bold ${bandClass[scoreBand(data.overallScore ?? 0)]}`}>
              {data.overallScore ?? 0}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Dimensiones</CardTitle></CardHeader>
          <CardContent><ScoreRadar scores={data.dimensionScores} /></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Feedback</CardTitle></CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          <FeedbackList title="Fortalezas" items={data.feedback.strengths} />
          <FeedbackList title="Debilidades" items={data.feedback.weaknesses} />
          <FeedbackList title="Recomendaciones" items={data.feedback.recommendations} />
          <FeedbackList title="Plan de mejora" items={data.feedback.improvementPlan} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Tus respuestas vs. respuesta modelo</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {data.answers.map((a) => (
            <div key={a.questionId} className="rounded-lg border p-4">
              <p className="font-medium">{a.questionText}</p>
              <p className="mt-2 text-sm"><span className="text-muted-foreground">Tu respuesta: </span>{a.answerText}</p>
              <p className="mt-1 text-sm"><span className="text-muted-foreground">Respuesta modelo: </span>{a.modelAnswer}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
