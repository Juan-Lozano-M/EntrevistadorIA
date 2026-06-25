import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, Bot, Send, Flag, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { startChat, sendChatMessage, finishInterview, ApiError, type ChatMessage } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

function AiAvatar() {
  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/20">
      <Bot className="h-5 w-5" />
    </span>
  );
}

function UserAvatar({ initial }: { initial: string }) {
  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
      {initial}
    </span>
  );
}

function MessageRow({ role, content, initial }: { role: "user" | "assistant"; content: string; initial: string }) {
  const isUser = role === "user";
  return (
    <div className={cn("flex items-end gap-2.5", isUser ? "flex-row-reverse" : "flex-row")}>
      {isUser ? <UserAvatar initial={initial} /> : <AiAvatar />}
      <div className={cn(
        "max-w-[80%] whitespace-pre-wrap wrap-break-word rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm",
        isUser
          ? "rounded-br-md bg-primary text-primary-foreground"
          : "rounded-bl-md border border-border bg-card text-card-foreground",
      )}>
        {content}
      </div>
    </div>
  );
}

function TypingRow() {
  return (
    <div className="flex items-end gap-2.5">
      <AiAvatar />
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-border bg-card px-4 py-3.5">
        {[0, 150, 300].map((d) => (
          <span key={d} className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60"
            style={{ animationDelay: `${d}ms` }} />
        ))}
      </div>
    </div>
  );
}

export function ChatInterviewPage() {
  const { id } = useParams();
  const sessionId = Number(id);
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const initial = user?.name?.trim()?.[0]?.toUpperCase() ?? "T";

  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<ChatMessage[]>([]);
  const [ending, setEnding] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  // Starting the chat returns the conversation, generating the AI's opening message if empty.
  const history = useQuery({ queryKey: ["chat", sessionId], queryFn: () => startChat(sessionId) });
  useEffect(() => { if (history.data) setMsgs(history.data); }, [history.data]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const send = useMutation({
    mutationFn: (text: string) => sendChatMessage(sessionId, text),
    onSuccess: (r) => {
      setMsgs((m) => [...m, { role: "assistant", content: r.reply }]);
      if (r.finished) {
        setEnding(true);
        toast.info("El entrevistador dio por finalizada la entrevista.");
        setTimeout(() => navigate(`/results/${sessionId}`), 1500);
      }
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Error al enviar"),
  });

  const finish = useMutation({
    mutationFn: () => finishInterview(sessionId),
    onSuccess: () => navigate(`/results/${sessionId}`),
    onError: (e) => { setEnding(false); toast.error(e instanceof ApiError ? e.message : "Error al finalizar"); },
  });

  const handleFinish = () => {
    if (finish.isPending || ending) return;
    setEnding(true);
    finish.mutate();
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text || send.isPending) return;
    setMsgs((m) => [...m, { role: "user", content: text }]);
    setInput("");
    send.mutate(text);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background lg:static lg:z-auto lg:mx-auto lg:h-[calc(100dvh-9rem)] lg:max-w-2xl lg:overflow-hidden lg:rounded-2xl lg:border lg:border-border lg:shadow-sm">
      {/* Top bar */}
      <header className="flex items-center gap-3 border-b border-border bg-card/90 px-2.5 py-2.5 backdrop-blur-md sm:px-4">
        <Link to="/app" aria-label="Volver al panel"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-secondary lg:hidden">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <AiAvatar />
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate font-display font-semibold">Entrevistador IA</p>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> En línea
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleFinish}
          disabled={finish.isPending || ending || msgs.length === 0}>
          <Flag className="h-4 w-4" /> Finalizar
        </Button>
      </header>

      {/* Messages */}
      <div className="scrollbar-slim flex-1 overflow-x-hidden overflow-y-auto">
        <div className="mx-auto max-w-2xl space-y-5 px-3 py-4 sm:px-4 sm:py-6">
          {history.isLoading && (
            <div className="space-y-2 pt-6">
              <TypingRow />
              <p className="text-center text-sm text-muted-foreground">El entrevistador está preparando la primera pregunta…</p>
            </div>
          )}
          {!history.isLoading && msgs.length === 0 && (
            <p className="py-10 text-center text-muted-foreground">No se pudo iniciar la conversación. Recarga la página.</p>
          )}
          {msgs.map((m, i) => (
            <MessageRow key={i} role={m.role} content={m.content} initial={initial} />
          ))}
          {send.isPending && <TypingRow />}
          <div ref={endRef} />
        </div>
      </div>

      {/* Composer */}
      <div className="border-t border-border bg-card">
        <div className="mx-auto flex max-w-2xl items-end gap-2 px-3 py-2.5 sm:px-4">
          <Textarea
            rows={1}
            value={input}
            placeholder="Escribe tu respuesta…"
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
            }}
            className="scrollbar-slim max-h-32 min-h-11 flex-1 resize-none rounded-2xl"
          />
          <Button size="icon" className="h-11 w-11 shrink-0 rounded-full" onClick={handleSend}
            disabled={!input.trim() || send.isPending} aria-label="Enviar">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {(finish.isPending || ending) && (
        <div className="fixed inset-0 z-60 flex flex-col items-center justify-center gap-4 bg-background/85 backdrop-blur-sm">
          <Loader2 className="h-9 w-9 animate-spin text-primary" />
          <p className="font-display text-lg font-semibold">Finalizando entrevista…</p>
          <p className="max-w-xs text-center text-sm text-muted-foreground">
            Estamos evaluando tus respuestas y preparando tu informe.
          </p>
        </div>
      )}
    </div>
  );
}
