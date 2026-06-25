import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Check, Minus, Crown, ShieldCheck, RotateCcw, Plus, ChevronDown } from "lucide-react";
import { getBillingConfig } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { Brand } from "@/components/Brand";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const FREE_FEATURES = [
  { text: "3 entrevistas al día", on: true },
  { text: "11 profesiones y 7 niveles", on: true },
  { text: "Evaluación por 8 dimensiones", on: true },
  { text: "Plan de mejora personalizado", on: true },
  { text: "Español e inglés", on: true },
  { text: "Chat con IA", on: false },
  { text: "Entrevistas por voz", on: false },
];

const PRO_FEATURES = [
  "Entrevistas ilimitadas",
  "Chat con la IA en tiempo real",
  "Entrevistas por voz",
  "Recordatorios y resumen por email",
];

const FAQS = [
  {
    q: "¿Puedo cambiar de plan en cualquier momento?",
    a: "Sí. Pasa a Pro cuando quieras y cancela desde Configuración → Suscripción; al cancelar vuelves al plan Gratis.",
  },
  {
    q: "¿Qué métodos de pago aceptan?",
    a: "Tarjetas de crédito y débito a través de MercadoPago, con pago cifrado. No almacenamos los datos de tu tarjeta.",
  },
  {
    q: "¿Cómo funciona la cancelación?",
    a: "Puedes cancelar en cualquier momento para no renovar y volver al plan Gratis. No gestionamos reembolsos de periodos ya facturados.",
  },
  {
    q: "¿Qué incluye el plan Gratis?",
    a: "3 entrevistas al día con evaluación por 8 dimensiones y un plan de mejora, en modalidad estándar y sin tarjeta.",
  },
];

export function PlansPage() {
  const navigate = useNavigate();
  const { token, user } = useAuthStore();
  const isAuthed = !!token;
  const isPremium = user?.plan === "PREMIUM";

  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const cfg = useQuery({ queryKey: ["billing-config"], queryFn: getBillingConfig });
  const monthly = cfg.data?.amount ?? 0;
  const currency = cfg.data?.currency ?? "";
  const proPrice = annual ? Math.round(monthly * 0.8) : monthly;

  const onChoosePro = () => {
    if (isPremium) return;
    navigate(isAuthed ? "/checkout" : "/register");
  };

  return (
    <div className="app-backdrop min-h-screen overflow-x-hidden">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="flex items-center justify-between px-4 py-3.5 sm:px-6">
          <Link to="/" aria-label="Inicio"><Brand /></Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {isAuthed ? (
              <Button asChild size="sm"><Link to="/app">Ir al panel</Link></Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                  <Link to="/login">Iniciar sesión</Link>
                </Button>
                <Button asChild size="sm"><Link to="/register">Empezar gratis</Link></Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        {/* Hero */}
        <section className="rise pt-8 text-center sm:pt-10">
          <span className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-sm font-medium text-accent-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Precios simples y transparentes
          </span>
          <h1 className="mx-auto mt-4 max-w-2xl font-display text-4xl font-bold leading-[1.08] sm:text-5xl">
            Invierte en tu{" "}
            <span className="bg-linear-to-b from-foreground to-muted-foreground bg-clip-text text-transparent">
              próxima oportunidad
            </span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-lg text-muted-foreground">
            Empieza gratis. Mejora cuando estés listo para practicar sin límites.
          </p>

          {/* Billing toggle */}
          <div className="mt-6 flex items-center justify-center gap-3">
            <div className="inline-flex rounded-full border border-border bg-card p-1">
              {[{ k: false, l: "Mensual" }, { k: true, l: "Anual" }].map(({ k, l }) => (
                <button key={l} onClick={() => setAnnual(k)}
                  className={cn("rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                    annual === k ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
                  {l}
                </button>
              ))}
            </div>
            <span className="rounded-full bg-green-500/15 px-2.5 py-1 text-xs font-semibold text-green-600 dark:text-green-400">
              Ahorra 20%
            </span>
          </div>
        </section>

        {/* Plans */}
        <section className="mx-auto mt-8 grid max-w-3xl gap-5 md:grid-cols-2">
          {/* Free */}
          <div className="flex flex-col rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-xl font-semibold">Gratis</h2>
            <p className="mt-1 text-sm text-muted-foreground">Para probar la plataforma y dar tus primeros pasos.</p>
            <div className="mt-6">
              <span className="font-mono text-4xl font-bold tabular">$0</span>
              <p className="mt-1 text-sm text-muted-foreground">Para siempre</p>
            </div>
            {isAuthed && !isPremium ? (
              <Button variant="outline" className="mt-6 w-full" disabled>Plan actual</Button>
            ) : (
              <Button asChild={!isAuthed} variant="outline" className="mt-6 w-full" disabled={isAuthed}>
                {isAuthed ? <span>Incluido</span> : <Link to="/register">Empezar gratis</Link>}
              </Button>
            )}
            <div className="mt-6 border-t border-border pt-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Incluye</p>
              <ul className="mt-3 space-y-2.5 text-sm">
                {FREE_FEATURES.map((f) => (
                  <li key={f.text} className={cn("flex items-center gap-2.5", !f.on && "text-muted-foreground")}>
                    {f.on
                      ? <Check className="h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />
                      : <Minus className="h-4 w-4 shrink-0 text-muted-foreground/60" />}
                    {f.text}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Pro */}
          <div className="relative flex flex-col rounded-2xl border-2 border-primary bg-card p-6 shadow-lg">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-foreground">
              Más popular
            </span>
            <h2 className="font-display text-xl font-semibold">Pro</h2>
            <p className="mt-1 text-sm text-muted-foreground">Para profesionales que se preparan en serio.</p>
            <div className="mt-6">
              <span className="font-mono text-4xl font-bold tabular">
                {proPrice.toLocaleString()}
              </span>
              <span className="ml-1 text-muted-foreground">{currency} /mes</span>
              <p className="mt-1 text-sm text-muted-foreground">
                {annual ? "Plan anual · facturación anual disponible pronto" : "Facturado mensualmente"}
              </p>
            </div>
            {isPremium ? (
              <Button className="mt-6 w-full" disabled>Tu plan actual</Button>
            ) : (
              <Button onClick={onChoosePro} className="mt-6 w-full">
                <Crown className="h-4 w-4" /> Elegir Pro
              </Button>
            )}
            <div className="mt-6 border-t border-border pt-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Todo lo de Gratis, más</p>
              <ul className="mt-3 space-y-2.5 text-sm">
                {PRO_FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 shrink-0 text-green-600 dark:text-green-400" /> {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Trust badges */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5"><RotateCcw className="h-4 w-4 text-green-600 dark:text-green-400" /> Cancela cuando quieras</span>
          <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-green-600 dark:text-green-400" /> Pago seguro cifrado</span>
        </div>

        {/* FAQ */}
        <section className="mx-auto mt-20 max-w-2xl">
          <h2 className="text-center font-display text-2xl font-semibold sm:text-3xl">Preguntas frecuentes</h2>
          <div className="mt-8 space-y-3">
            {FAQS.map((item, i) => {
              const open = openFaq === i;
              return (
                <div key={item.q} className="rounded-xl border border-border bg-card">
                  <button onClick={() => setOpenFaq(open ? null : i)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left">
                    <span className="font-medium">{item.q}</span>
                    {open
                      ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                      : <Plus className="h-4 w-4 shrink-0 text-muted-foreground" />}
                  </button>
                  {open && <p className="px-5 pb-4 text-sm leading-relaxed text-muted-foreground">{item.a}</p>}
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
