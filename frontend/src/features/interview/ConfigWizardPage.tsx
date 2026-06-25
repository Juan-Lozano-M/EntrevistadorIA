import { Brand } from "@/components/Brand";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ApiError,
  createInterview,
  getHistory,
  getOptions,
  getProfessions,
  type Profession,
} from "@/lib/api";
import { LEVEL_LABELS, TYPE_LABELS, levelLabel, typeLabel } from "@/lib/labels";
import { ROLE_SUGGESTIONS } from "@/lib/roleSuggestions";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Crown,
  MessageSquare,
  Mic,
  Search,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

const DURATIONS = [15, 30, 45, 60];
const LANGUAGES = [
  { value: "es", label: "Español" },
  { value: "en", label: "Inglés" },
];
const TOTAL_STEPS = 5;
const FREE_DAILY_LIMIT = 3;

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function isToday(iso: string): boolean {
  const d = new Date(iso),
    n = new Date();
  return (
    d.getFullYear() === n.getFullYear() &&
    d.getMonth() === n.getMonth() &&
    d.getDate() === n.getDate()
  );
}

export function ConfigWizardPage() {
  const navigate = useNavigate();
  const professions = useQuery({
    queryKey: ["professions"],
    queryFn: getProfessions,
  });
  const options = useQuery({ queryKey: ["options"], queryFn: getOptions });
  const history = useQuery({ queryKey: ["history"], queryFn: getHistory });

  const { user } = useAuthStore();
  const isPremium = user?.plan === "PREMIUM";

  const usedToday = (history.data ?? []).filter((s) =>
    isToday(s.startedAt),
  ).length;
  const remaining = Math.max(0, FREE_DAILY_LIMIT - usedToday);
  const limitReached =
    !isPremium && history.data !== undefined && remaining === 0;

  const prefs = useSettingsStore();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    professionSlug: prefs.professionSlug,
    roleTitle: "",
    targetCompany: "",
    industry: "",
    level: prefs.level,
    type: prefs.type,
    language: prefs.language,
    durationMinutes: 30,
    modality: "STANDARD" as "STANDARD" | "CHAT" | "VOICE",
  });
  const [error, setError] = useState<string | null>(null);
  const [profSearch, setProfSearch] = useState("");
  const [profPage, setProfPage] = useState(1);

  // Default level/type once options arrive.
  if (options.data && !form.level && options.data.levels.length > 0) {
    setForm((f) => ({
      ...f,
      level: options.data!.levels[0],
      type: options.data!.types[0],
    }));
  }

  const mutation = useMutation({
    mutationFn: createInterview,
    onSuccess: (s) => {
      toast.success("Entrevista creada");
      const path =
        s.modality === "CHAT"
          ? `/chat/${s.id}`
          : s.modality === "VOICE"
            ? `/voice/${s.id}`
            : `/interview/${s.id}`;
      navigate(path);
    },
    onError: (e) =>
      setError(e instanceof ApiError ? e.message : "Error inesperado"),
  });

  const selectedProfession = professions.data?.find(
    (p) => p.slug === form.professionSlug,
  );
  const roleSuggestions = ROLE_SUGGESTIONS[form.professionSlug] ?? [];

  const PROF_PAGE_SIZE = 6;
  const filteredProfessions = (professions.data ?? []).filter((p) =>
    p.name.toLowerCase().includes(profSearch.trim().toLowerCase()),
  );
  const profTotalPages = Math.max(
    1,
    Math.ceil(filteredProfessions.length / PROF_PAGE_SIZE),
  );
  const profPageSafe = Math.min(profPage, profTotalPages);
  const pageProfessions = filteredProfessions.slice(
    (profPageSafe - 1) * PROF_PAGE_SIZE,
    profPageSafe * PROF_PAGE_SIZE,
  );

  const steps = [
    {
      n: 1,
      title: "Profesión",
      summary: selectedProfession?.name ?? "Sin seleccionar",
    },
    {
      n: 2,
      title: "Detalles",
      summary: form.roleTitle.trim() || "Cargo por definir",
    },
    {
      n: 3,
      title: "Nivel y tipo",
      summary: form.level
        ? `${levelLabel(form.level)} · ${typeLabel(form.type)}`
        : "Por definir",
    },
    {
      n: 4,
      title: "Idioma y duración",
      summary: `${form.language === "es" ? "Español" : "Inglés"} · ${form.durationMinutes} min`,
    },
    {
      n: 5,
      title: "Modalidad",
      summary:
        form.modality === "CHAT"
          ? "Chat con IA"
          : form.modality === "VOICE"
            ? "Voz con IA"
            : "Estándar",
    },
  ];

  const modalityReady = form.modality === "STANDARD" || isPremium;
  // All required fields (used to gate the final submit, since the stepper lets you jump ahead).
  const formComplete = !!form.professionSlug && !!form.roleTitle.trim() && modalityReady;
  const canContinue =
    (step === 1 && !!form.professionSlug) ||
    (step === 2 && !!form.roleTitle.trim()) ||
    step === 3 ||
    step === 4 ||
    (step === 5 && formComplete);

  const next = () => {
    setError(null);
    if (step < TOTAL_STEPS) setStep(step + 1);
    else mutation.mutate(form);
  };

  return (
    <div className="app-backdrop min-h-screen">
      {/* Wizard header */}
      <header className="border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="flex items-center justify-between px-4 py-3.5 sm:px-6">
          <Link to="/app" aria-label="Volver al panel">
            <Brand />
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Paso {step} de {TOTAL_STEPS}
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-6 lg:grid-cols-[240px_1fr] lg:gap-10 lg:py-8">
        {/* Stepper (desktop sidebar) */}
        <aside className="hidden lg:block">
          <p className="mb-5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Configuración
          </p>
          <ol className="space-y-5">
            {steps.map((s) => {
              const active = s.n === step;
              const done = s.n < step;
              return (
                <li key={s.n}>
                  <button
                    type="button"
                    onClick={() => setStep(s.n)}
                    className="flex w-full items-center gap-3 text-left"
                  >
                    <span
                      className={cn(
                        "grid h-7 w-7 shrink-0 place-items-center rounded-full border text-sm font-mono font-semibold transition-colors",
                        active &&
                          "border-primary bg-primary text-primary-foreground",
                        done && "border-primary bg-primary/10 text-primary",
                        !active &&
                          !done &&
                          "border-border text-muted-foreground",
                      )}
                    >
                      {done ? <Check className="h-4 w-4" /> : s.n}
                    </span>
                    <span className="min-w-0">
                      <span
                        className={cn(
                          "block text-sm font-medium",
                          active ? "text-foreground" : "text-muted-foreground",
                        )}
                      >
                        {s.title}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {s.summary}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </aside>

        {/* Step content */}
        <section>
          {/* Compact progress (mobile only) */}
          <div className="mb-5 lg:hidden">
            <div className="flex gap-1.5">
              {steps.map((s) => (
                <button key={s.n} type="button" aria-label={s.title} onClick={() => setStep(s.n)}
                  className={cn("h-1.5 flex-1 rounded-full transition-colors",
                    s.n <= step ? "bg-primary" : "bg-secondary")} />
              ))}
            </div>
            <p className="mt-2.5 text-sm font-semibold">
              <span className="font-mono text-muted-foreground">{step}.</span> {steps[step - 1].title}
            </p>
          </div>

          {professions.isError || options.isError ? (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              No se pudo cargar la configuración. Recarga la página o vuelve a
              iniciar sesión.
            </p>
          ) : !professions.data || !options.data ? (
            <p className="text-muted-foreground">Cargando…</p>
          ) : (
            <div className="rise">
              {!isPremium && history.data !== undefined && (
                <div
                  className={cn(
                    "mb-6 flex flex-col gap-3 rounded-xl border px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between",
                    limitReached
                      ? "border-destructive/40 bg-destructive/10 text-destructive"
                      : "border-border bg-secondary/50 text-muted-foreground",
                  )}
                >
                  <span>
                    {limitReached ? (
                      `Has usado tus ${FREE_DAILY_LIMIT} entrevistas de hoy. Vuelve mañana o mejora a Premium para entrevistas ilimitadas.`
                    ) : (
                      <>
                        Plan Free · te {remaining === 1 ? "queda" : "quedan"}{" "}
                        <strong className="font-semibold">{remaining}</strong>{" "}
                        de {FREE_DAILY_LIMIT} entrevistas hoy.
                      </>
                    )}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate("/precios")}
                    className="shrink-0 border-gold/40 text-gold hover:bg-gold/10"
                  >
                    <Crown className="h-4 w-4" /> Mejorar a Premium
                  </Button>
                </div>
              )}

              {step === 1 && (
                <Step
                  title="¿Para qué puesto te preparas?"
                  subtitle="Elige la profesión para tu entrevista."
                >
                  <div className="space-y-4">
                    <div className="relative max-w-sm">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        className="pl-9"
                        placeholder="Buscar profesión…"
                        value={profSearch}
                        onChange={(e) => {
                          setProfSearch(e.target.value);
                          setProfPage(1);
                        }}
                      />
                    </div>

                    {filteredProfessions.length === 0 ? (
                      <p className="py-6 text-center text-sm text-muted-foreground">
                        No se encontraron profesiones para “{profSearch.trim()}
                        ”.
                      </p>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                          {pageProfessions.map((p) => (
                            <ProfessionCard
                              key={p.slug}
                              profession={p}
                              selected={form.professionSlug === p.slug}
                              onSelect={() =>
                                setForm({ ...form, professionSlug: p.slug })
                              }
                            />
                          ))}
                        </div>

                        {profTotalPages > 1 && (
                          <div className="flex items-center justify-center gap-4 pt-1">
                            <button
                              type="button"
                              aria-label="Anterior"
                              onClick={() =>
                                setProfPage((p) => Math.max(1, p - 1))
                              }
                              disabled={profPageSafe === 1}
                              className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-secondary disabled:opacity-40"
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </button>
                            <span className="text-sm text-muted-foreground">
                              Página{" "}
                              <span className="font-mono font-semibold text-foreground">
                                {profPageSafe}
                              </span>{" "}
                              de {profTotalPages}
                            </span>
                            <button
                              type="button"
                              aria-label="Siguiente"
                              onClick={() =>
                                setProfPage((p) =>
                                  Math.min(profTotalPages, p + 1),
                                )
                              }
                              disabled={profPageSafe === profTotalPages}
                              className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-secondary disabled:opacity-40"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </Step>
              )}

              {step === 2 && (
                <Step
                  title="Cuéntanos los detalles"
                  subtitle="El cargo es obligatorio; lo demás es opcional."
                >
                  <div className="max-w-lg space-y-5">
                    <div className="space-y-1.5">
                      <Label htmlFor="role">Cargo</Label>
                      <Input
                        id="role"
                        placeholder="p. ej. Backend Developer"
                        value={form.roleTitle}
                        onChange={(e) =>
                          setForm({ ...form, roleTitle: e.target.value })
                        }
                      />
                      {roleSuggestions.length > 0 && (
                        <div className="pt-1">
                          <p className="mb-1.5 text-xs text-muted-foreground">
                            Sugerencias para {selectedProfession?.name}:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {roleSuggestions.map((role) => (
                              <button
                                key={role}
                                type="button"
                                onClick={() =>
                                  setForm({ ...form, roleTitle: role })
                                }
                                aria-pressed={form.roleTitle === role}
                                className={cn(
                                  "rounded-full border px-3 py-1 text-sm transition-colors",
                                  form.roleTitle === role
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-border bg-card text-muted-foreground hover:border-primary/50",
                                )}
                              >
                                {role}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="company">
                        Empresa{" "}
                        <span className="text-muted-foreground">
                          (opcional)
                        </span>
                      </Label>
                      <Input
                        id="company"
                        value={form.targetCompany}
                        onChange={(e) =>
                          setForm({ ...form, targetCompany: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="industry">
                        Industria{" "}
                        <span className="text-muted-foreground">
                          (opcional)
                        </span>
                      </Label>
                      <Input
                        id="industry"
                        value={form.industry}
                        onChange={(e) =>
                          setForm({ ...form, industry: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </Step>
              )}

              {step === 3 && (
                <Step
                  title="Nivel y tipo"
                  subtitle="¿Qué tan exigente y qué enfoque quieres?"
                >
                  <div className="space-y-7">
                    <ChipGroup
                      label="Nivel"
                      options={options.data!.levels.map((l) => ({
                        value: l,
                        label: LEVEL_LABELS[l] ?? l,
                      }))}
                      value={form.level}
                      onChange={(v) => setForm({ ...form, level: v })}
                    />
                    <ChipGroup
                      label="Tipo"
                      options={options.data!.types.map((t) => ({
                        value: t,
                        label: TYPE_LABELS[t] ?? t,
                      }))}
                      value={form.type}
                      onChange={(v) => setForm({ ...form, type: v })}
                    />
                  </div>
                </Step>
              )}

              {step === 4 && (
                <Step
                  title="Idioma y duración"
                  subtitle="Últimos ajustes antes de empezar."
                >
                  <div className="space-y-7">
                    <ChipGroup
                      label="Idioma"
                      options={LANGUAGES}
                      value={form.language}
                      onChange={(v) => setForm({ ...form, language: v })}
                    />
                    <ChipGroup
                      label="Duración"
                      options={DURATIONS.map((d) => ({
                        value: String(d),
                        label: `${d} min`,
                      }))}
                      value={String(form.durationMinutes)}
                      onChange={(v) =>
                        setForm({ ...form, durationMinutes: Number(v) })
                      }
                    />
                  </div>
                </Step>
              )}

              {step === 5 && (
                <Step
                  title="Modalidad de la entrevista"
                  subtitle="Elige cómo quieres practicar."
                >
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <ModalityCard
                      icon={ClipboardList}
                      title="Estándar"
                      text="Preguntas guiadas con cronómetro y autoevaluación. Incluida en tu plan."
                      selected={form.modality === "STANDARD"}
                      onSelect={() =>
                        setForm({ ...form, modality: "STANDARD" })
                      }
                    />
                    <ModalityCard
                      icon={MessageSquare}
                      title="Chat con IA"
                      text="Conversación libre con un entrevistador IA que repregunta en tiempo real."
                      premium
                      selected={form.modality === "CHAT"}
                      onSelect={() => setForm({ ...form, modality: "CHAT" })}
                    />
                    <ModalityCard
                      icon={Mic}
                      title="Voz con IA"
                      text="Entrevista hablada: responde por voz y la IA te habla. Lo más cercano a la realidad."
                      premium
                      selected={form.modality === "VOICE"}
                      onSelect={() => setForm({ ...form, modality: "VOICE" })}
                    />
                  </div>
                  {(form.modality === "CHAT" || form.modality === "VOICE") &&
                    !isPremium && (
                      <div className="mt-6 flex flex-col gap-3 rounded-xl border border-gold/40 bg-gold/10 p-5 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-display font-semibold">
                            Esta modalidad es Premium
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Mejora tu plan para practicar con el entrevistador
                            IA.
                          </p>
                        </div>
                        <Button
                          onClick={() => navigate("/precios")}
                          className="shrink-0 bg-gold text-gold-foreground hover:bg-gold/90"
                        >
                          <Crown className="h-4 w-4" /> Mejorar a Premium
                        </Button>
                      </div>
                    )}
                </Step>
              )}

              {error && (
                <p className="mt-6 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}

              {step === TOTAL_STEPS && !formComplete && (
                <p className="mt-6 rounded-md bg-gold/10 px-3 py-2 text-sm text-gold">
                  {!form.professionSlug ? (
                    <>Falta elegir la{" "}
                      <button type="button" onClick={() => setStep(1)} className="font-semibold underline">profesión</button>.</>
                  ) : !form.roleTitle.trim() ? (
                    <>Falta indicar el{" "}
                      <button type="button" onClick={() => setStep(2)} className="font-semibold underline">cargo</button>.</>
                  ) : (
                    <>La modalidad elegida es Premium. Mejora tu plan o elige Estándar.</>
                  )}
                </p>
              )}

              {/* Footer nav */}
              <div className="mt-8 flex items-center justify-between border-t border-border pt-5">
                <Button
                  variant="ghost"
                  disabled={step === 1}
                  onClick={() => {
                    setError(null);
                    setStep(step - 1);
                  }}
                >
                  <ArrowLeft className="h-4 w-4" /> Atrás
                </Button>
                <Button
                  size="lg"
                  disabled={
                    !canContinue ||
                    mutation.isPending ||
                    (step === TOTAL_STEPS && limitReached)
                  }
                  onClick={next}
                >
                  {step === TOTAL_STEPS ? (
                    "Comenzar entrevista"
                  ) : (
                    <>
                      Continuar <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </section>
      </div>

    </div>
  );
}

function Step({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h1 className="font-display text-3xl font-bold">{title}</h1>
      <p className="mt-1.5 text-muted-foreground">{subtitle}</p>
      <div className="mt-7">{children}</div>
    </div>
  );
}

function ProfessionCard({
  profession,
  selected,
  onSelect,
}: {
  profession: Profession;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "flex item-center gap-3.5 rounded-xl border bg-card p-6 text-left transition-all hover:-translate-y-0.5 hover:shadow-md",
        selected ? "border-primary ring-2 ring-primary/30" : "border-border",
      )}
    >
      <span
        className={cn(
          "grid h-11 w-11 shrink-0 place-items-center rounded-lg font-mono text-sm font-semibold",
          selected
            ? "bg-primary text-primary-foreground"
            : "bg-secondary text-muted-foreground",
        )}
      >
        {initials(profession.name)}
      </span>
      <span className="font-display font-semibold leading-snug">
        {profession.name}
      </span>
    </button>
  );
}

function ModalityCard({
  icon: Icon,
  title,
  text,
  selected,
  onSelect,
  premium,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  selected: boolean;
  onSelect: () => void;
  premium?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "relative flex flex-col gap-3 rounded-xl border bg-card p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-md",
        selected ? "border-primary ring-2 ring-primary/30" : "border-border",
      )}
    >
      {premium && (
        <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-gold/15 px-2 py-0.5 text-xs font-medium text-gold">
          <Crown className="h-3 w-3" /> Premium
        </span>
      )}
      <span
        className={cn(
          "grid h-10 w-10 place-items-center rounded-lg",
          selected
            ? "bg-primary text-primary-foreground"
            : "bg-secondary text-muted-foreground",
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <span className="font-display text-lg font-semibold">{title}</span>
      <span className="text-sm text-muted-foreground">{text}</span>
    </button>
  );
}

function ChipGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="mb-3 text-sm font-medium">{label}</p>
      <div className="flex flex-wrap gap-2.5">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            aria-pressed={value === o.value}
            className={cn(
              "rounded-full border px-4 py-2 text-sm transition-colors",
              value === o.value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-card-foreground hover:border-primary/50",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
