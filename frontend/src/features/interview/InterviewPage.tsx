import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Clock } from "lucide-react";
import { toast } from "sonner";
import { getNextQuestion, submitAnswer, finishInterview, ApiError } from "@/lib/api";
import { useInterviewStore } from "@/stores/interviewStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = String(Math.floor(total / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${m}:${s}`;
}

export function InterviewPage() {
  const { id } = useParams();
  const sessionId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { markShown, elapsedMs } = useInterviewStore();

  const [answer, setAnswer] = useState("");
  const [confidence, setConfidence] = useState(3);
  const [, setTick] = useState(0);

  const next = useQuery({
    queryKey: ["next-question", sessionId],
    queryFn: () => getNextQuestion(sessionId),
  });

  const questionId = next.data?.question?.id;

  // Start the timer whenever a new question is shown.
  useEffect(() => {
    if (next.data?.question) markShown();
  }, [questionId, markShown]);

  // Tick once a second so the live timer chip updates while answering.
  useEffect(() => {
    if (!questionId) return;
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [questionId]);

  const finish = useMutation({
    mutationFn: () => finishInterview(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["history"] });
      navigate(`/results/${sessionId}`);
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Error al finalizar"),
  });

  const submit = useMutation({
    mutationFn: () =>
      submitAnswer(sessionId, {
        questionId: next.data!.question!.id,
        answerText: answer,
        responseTimeMs: elapsedMs(),
        selfConfidence: confidence,
      }),
    onSuccess: async () => {
      setAnswer("");
      setConfidence(3);
      const refreshed = await queryClient.fetchQuery({
        queryKey: ["next-question", sessionId],
        queryFn: () => getNextQuestion(sessionId),
      });
      if (refreshed.finished) finish.mutate();
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Error al enviar"),
  });

  if (next.isLoading) return <p className="text-muted-foreground">Cargando pregunta…</p>;

  if (next.data?.finished) {
    return (
      <Card className="mx-auto max-w-2xl text-center rise">
        <CardContent className="flex flex-col items-center gap-4 py-14">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-gold/15 text-gold">
            <Clock className="h-7 w-7" />
          </span>
          <p className="font-display text-xl font-semibold">Has respondido todas las preguntas.</p>
          <Button size="lg" onClick={() => finish.mutate()} disabled={finish.isPending}>
            Ver resultados
          </Button>
        </CardContent>
      </Card>
    );
  }

  const q = next.data!.question!;
  const progress = q.total > 0 ? Math.round((q.index / q.total) * 100) : 0;

  return (
    <div className="mx-auto max-w-2xl rise">
      {/* progress rail */}
      <div className="mb-5 flex items-center gap-4">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <span className="font-mono text-xs tabular text-muted-foreground">
          {String(q.index).padStart(2, "0")} / {String(q.total).padStart(2, "0")}
        </span>
      </div>

      <Card>
        <CardContent className="space-y-6 py-7">
          <div className="flex items-start justify-between gap-4">
            <p className="font-mono text-xs uppercase tracking-widest text-primary">Entrevistador</p>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 font-mono text-xs tabular text-muted-foreground">
              <Clock className="h-3.5 w-3.5" /> {formatElapsed(elapsedMs())}
            </span>
          </div>

          <h1 className="font-display text-2xl font-semibold leading-snug">{q.text}</h1>

          <Textarea rows={7} value={answer} placeholder="Escribe tu respuesta…"
            onChange={(e) => setAnswer(e.target.value)} />

          <div className="space-y-2">
            <Label>¿Qué tan seguro te sentiste? <span className="text-primary">({confidence}/5)</span></Label>
            <Slider min={1} max={5} step={1} value={[confidence]} onValueChange={(v) => setConfidence(v[0])} />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Nada seguro</span><span>Muy seguro</span>
            </div>
          </div>

          <Button size="lg" className="w-full" disabled={!answer.trim() || submit.isPending}
            onClick={() => submit.mutate()}>
            Enviar respuesta
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
