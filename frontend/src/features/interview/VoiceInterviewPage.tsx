import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, Bot, Check, ChevronDown, Flag, Loader2, Mic, MicOff, Square, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { startChat, sendChatMessage, finishInterview, ApiError, type ChatMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// The Web Speech API isn't in the DOM lib typings; treat it loosely.
const SpeechRecognitionCtor: any =
  typeof window !== "undefined" ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition : undefined;
const speechSupported = !!SpeechRecognitionCtor && typeof window !== "undefined" && "speechSynthesis" in window;

type Status = "idle" | "listening" | "thinking" | "speaking";

// Rank voices so the most natural ones (neural / online / Google) win by default.
function voiceRank(v: SpeechSynthesisVoice): number {
  const n = `${v.name} ${v.voiceURI}`.toLowerCase();
  let s = 0;
  if (/natural|neural/.test(n)) s += 100;
  if (/online/.test(n)) s += 40;
  if (/google/.test(n)) s += 30;
  if (/premium|enhanced|wavenet/.test(n)) s += 20;
  if (v.localService === false) s += 10;
  return s;
}

export function VoiceInterviewPage() {
  const { id } = useParams();
  const sessionId = Number(id);
  const navigate = useNavigate();

  const [msgs, setMsgs] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [interim, setInterim] = useState("");
  const [lang, setLang] = useState<"es-ES" | "en-US">("es-ES");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceURI, setVoiceURI] = useState("");
  const [ending, setEnding] = useState(false);

  const recognitionRef = useRef<any>(null);
  const finalRef = useRef("");
  const spokenRef = useRef(-1); // index of last assistant message already spoken
  const endRef = useRef<HTMLDivElement>(null);

  const history = useQuery({ queryKey: ["chat", sessionId], queryFn: () => startChat(sessionId) });
  useEffect(() => { if (history.data) setMsgs(history.data); }, [history.data]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, interim]);

  // Voices load asynchronously; getVoices() is often empty on first call.
  useEffect(() => {
    if (!speechSupported) return;
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  const langVoices = voices
    .filter((v) => v.lang?.toLowerCase().startsWith(lang.slice(0, 2)))
    .sort((a, b) => voiceRank(b) - voiceRank(a));

  // Pick the best available voice for the language when the list or language changes.
  useEffect(() => {
    if (langVoices.length === 0) return;
    if (!langVoices.some((v) => v.voiceURI === voiceURI)) setVoiceURI(langVoices[0].voiceURI);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voices, lang]);

  // ---- Text-to-speech ----
  function speak(text: string) {
    if (!speechSupported) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const voice = voices.find((v) => v.voiceURI === voiceURI) ?? langVoices[0];
    if (voice) { u.voice = voice; u.lang = voice.lang; } else { u.lang = lang; }
    u.rate = 1;
    u.pitch = 1;
    u.onstart = () => setStatus("speaking");
    u.onend = () => setStatus((s) => (s === "speaking" ? "idle" : s));
    window.speechSynthesis.speak(u);
  }

  // Speak each new assistant message once it arrives.
  useEffect(() => {
    if (msgs.length === 0) return;
    const lastIdx = msgs.length - 1;
    const last = msgs[lastIdx];
    if (last.role === "assistant" && lastIdx > spokenRef.current) {
      spokenRef.current = lastIdx;
      speak(last.content);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [msgs]);

  // Stop everything on unmount.
  useEffect(() => () => {
    try { recognitionRef.current?.stop(); } catch { /* noop */ }
    if (speechSupported) window.speechSynthesis.cancel();
  }, []);

  const send = useMutation({
    mutationFn: (text: string) => sendChatMessage(sessionId, text),
    onSuccess: (r) => {
      setMsgs((m) => [...m, { role: "assistant", content: r.reply }]);
      if (r.finished) {
        setEnding(true);
        toast.info("El entrevistador dio por finalizada la entrevista.");
        setTimeout(() => navigate(`/results/${sessionId}`), 1800);
      }
    },
    onError: (e) => { setStatus("idle"); toast.error(e instanceof ApiError ? e.message : "Error al enviar"); },
  });

  const finish = useMutation({
    mutationFn: () => finishInterview(sessionId),
    onSuccess: () => navigate(`/results/${sessionId}`),
    onError: (e) => { setEnding(false); toast.error(e instanceof ApiError ? e.message : "Error al finalizar"); },
  });

  function handleFinish() {
    if (finish.isPending || ending) return;
    try { recognitionRef.current?.stop(); } catch { /* noop */ }
    if (speechSupported) window.speechSynthesis.cancel();
    setEnding(true);
    finish.mutate();
  }

  function submit(text: string) {
    const t = text.trim();
    if (!t) return;
    setMsgs((m) => [...m, { role: "user", content: t }]);
    setInterim("");
    setStatus("thinking");
    send.mutate(t);
  }

  function startListening() {
    if (!speechSupported || status === "thinking" || send.isPending) return;
    window.speechSynthesis.cancel();
    const rec = new SpeechRecognitionCtor();
    rec.lang = lang;
    rec.interimResults = true;
    rec.continuous = false;
    finalRef.current = "";
    rec.onresult = (e: any) => {
      let interimText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const transcript = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalRef.current += transcript;
        else interimText += transcript;
      }
      setInterim(finalRef.current + interimText);
    };
    rec.onerror = () => setStatus("idle");
    rec.onend = () => {
      recognitionRef.current = null;
      setStatus((s) => (s === "listening" ? "idle" : s));
      if (finalRef.current.trim()) submit(finalRef.current);
    };
    recognitionRef.current = rec;
    setStatus("listening");
    rec.start();
  }

  function stopListening() {
    try { recognitionRef.current?.stop(); } catch { /* noop */ }
  }

  function toggleMic() {
    if (status === "listening") stopListening();
    else startListening();
  }

  const statusLabel: Record<Status, string> = {
    idle: "Toca el micrófono para responder",
    listening: "Escuchando…",
    thinking: "El entrevistador está pensando…",
    speaking: "Hablando…",
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background lg:static lg:z-auto lg:mx-auto lg:h-[calc(100dvh-9rem)] lg:max-w-2xl lg:overflow-hidden lg:rounded-2xl lg:border lg:border-border lg:shadow-sm">
      {/* Top bar */}
      <header className="flex items-center gap-3 border-b border-border bg-card/90 px-2.5 py-2.5 backdrop-blur-md sm:px-4">
        <Link to="/app" aria-label="Volver al panel"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-secondary lg:hidden">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/20">
          <Bot className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate font-display font-semibold">Entrevista por voz</p>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={cn("h-1.5 w-1.5 rounded-full", status === "speaking" ? "bg-primary" : status === "listening" ? "bg-green-500" : "bg-muted-foreground/50")} />
            {statusLabel[status]}
          </p>
        </div>
        <select value={lang} onChange={(e) => setLang(e.target.value as "es-ES" | "en-US")}
          className="rounded-md border border-border bg-background px-2 py-1 text-xs text-muted-foreground"
          aria-label="Idioma de voz">
          <option value="es-ES">ES</option>
          <option value="en-US">EN</option>
        </select>
        {langVoices.length > 0 && (
          <VoiceSelect voices={langVoices} value={voiceURI} onChange={setVoiceURI} />
        )}
        <Button variant="outline" size="sm" onClick={handleFinish}
          disabled={finish.isPending || ending || msgs.length === 0}>
          <Flag className="h-4 w-4" /> Finalizar
        </Button>
      </header>

      {!speechSupported ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
          <MicOff className="h-10 w-10 text-muted-foreground" />
          <p className="font-display text-lg font-semibold">Tu navegador no soporta voz</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            La entrevista por voz necesita la Web Speech API (disponible en Chrome/Edge de escritorio).
            Prueba en otro navegador o usa la modalidad de chat.
          </p>
        </div>
      ) : (
        <>
          {/* Transcript */}
          <div className="scrollbar-slim flex-1 overflow-x-hidden overflow-y-auto">
            <div className="mx-auto max-w-2xl space-y-4 px-4 py-6">
              {history.isLoading && (
                <p className="text-center text-sm text-muted-foreground">El entrevistador está preparando la primera pregunta…</p>
              )}
              {msgs.map((m, i) => (
                <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "flex max-w-[85%] items-start gap-2 rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                    m.role === "user"
                      ? "rounded-br-md bg-primary text-primary-foreground"
                      : "rounded-bl-md border border-border bg-card text-card-foreground",
                  )}>
                    {m.role === "assistant" && <Volume2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />}
                    <span className="whitespace-pre-wrap wrap-break-word">{m.content}</span>
                  </div>
                </div>
              ))}
              {interim && (
                <div className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-br-md bg-primary/60 px-4 py-2.5 text-sm italic text-primary-foreground">
                    {interim}
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>
          </div>

          {/* Mic control */}
          <div className="border-t border-border bg-card px-4 py-6">
            <div className="mx-auto flex max-w-2xl flex-col items-center gap-3">
              <button
                onClick={toggleMic}
                disabled={status === "thinking" || status === "speaking" || send.isPending}
                aria-label={status === "listening" ? "Detener" : "Hablar"}
                className={cn(
                  "grid h-20 w-20 place-items-center rounded-full text-primary-foreground shadow-lg transition-all disabled:opacity-50",
                  status === "listening"
                    ? "animate-pulse bg-destructive ring-4 ring-destructive/30"
                    : "bg-primary hover:scale-105 ring-4 ring-primary/20",
                )}
              >
                {status === "listening" ? <Square className="h-7 w-7" /> : <Mic className="h-8 w-8" />}
              </button>
              <p className="text-xs text-muted-foreground">{statusLabel[status]}</p>
            </div>
          </div>
        </>
      )}

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

/** Custom voice picker — a native <select> dropdown can't have its scrollbar styled, so we
 *  render our own listbox whose scrollable list uses the .scrollbar-slim utility. */
function VoiceSelect({ voices, value, onChange }: {
  voices: SpeechSynthesisVoice[]; value: string; onChange: (uri: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = voices.find((v) => v.voiceURI === value);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [open]);

  return (
    <div ref={ref} className="relative hidden sm:block">
      <button type="button" onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox" aria-expanded={open} aria-label="Voz de la IA"
        className="flex max-w-36 items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs text-muted-foreground hover:text-foreground">
        <span className="truncate">{current?.name ?? "Voz"}</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0" />
      </button>
      {open && (
        <ul role="listbox"
          className="scrollbar-slim absolute right-0 z-50 mt-1 max-h-64 w-56 overflow-y-auto rounded-lg border border-border bg-card p-1 shadow-lg">
          {voices.map((v) => (
            <li key={v.voiceURI}>
              <button type="button" role="option" aria-selected={v.voiceURI === value}
                onClick={() => { onChange(v.voiceURI); setOpen(false); }}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-secondary",
                  v.voiceURI === value ? "text-primary" : "text-foreground",
                )}>
                <Check className={cn("h-3.5 w-3.5 shrink-0", v.voiceURI === value ? "opacity-100" : "opacity-0")} />
                <span className="truncate">{v.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
