import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getNextQuestion, submitAnswer, finishInterview, ApiError } from "@/lib/api";
import { useInterviewStore } from "@/stores/interviewStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

export function InterviewPage() {
  const { id } = useParams();
  const sessionId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { markShown, elapsedMs } = useInterviewStore();

  const [answer, setAnswer] = useState("");
  const [confidence, setConfidence] = useState(3);

  const next = useQuery({
    queryKey: ["next-question", sessionId],
    queryFn: () => getNextQuestion(sessionId),
  });

  // Start the timer whenever a new question is shown.
  useEffect(() => {
    if (next.data?.question) markShown();
  }, [next.data?.question?.id, markShown, next.data?.question]);

  const finish = useMutation({
    mutationFn: () => finishInterview(sessionId),
    onSuccess: () => navigate(`/results/${sessionId}`),
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

  if (next.isLoading) return <p>Cargando pregunta…</p>;
  if (next.data?.finished) {
    return (
      <div className="space-y-4 text-center">
        <p>Has respondido todas las preguntas.</p>
        <Button onClick={() => finish.mutate()} disabled={finish.isPending}>Ver resultados</Button>
      </div>
    );
  }

  const q = next.data!.question!;
  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <p className="text-sm text-muted-foreground">Pregunta {q.index} de {q.total}</p>
        <CardTitle className="text-lg">{q.text}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea rows={6} value={answer} placeholder="Escribe tu respuesta…"
          onChange={(e) => setAnswer(e.target.value)} />
        <div className="space-y-2">
          <Label>¿Qué tan seguro te sentiste? ({confidence}/5)</Label>
          <Slider min={1} max={5} step={1} value={[confidence]}
            onValueChange={(v) => setConfidence(v[0])} />
        </div>
        <Button className="w-full" disabled={!answer.trim() || submit.isPending}
          onClick={() => submit.mutate()}>
          Enviar respuesta
        </Button>
      </CardContent>
    </Card>
  );
}
