import { Brand } from "@/components/Brand";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Cpu, Gauge, LineChart, Menu, Sparkles, X } from "lucide-react";
import { Link } from "react-router-dom";

const professions = [
  "Desarrollo de Software",
  "Diseño UX/UI",
  "Marketing Digital",
  "Ventas",
  "Recursos Humanos",
  "Administración de Empresas",
  "Finanzas",
  "Contabilidad",
  "Medicina",
  "Enfermería",
  "Psicología",
  "Derecho",
  "Arquitectura",
  "Ingeniería Civil",
  "Ingeniería Industrial",
  "Atención al Cliente",
];

const features = [
  {
    icon: Cpu,
    title: "Motor de IA",
    text: "Entrevistadores realistas que adaptan las preguntas a tu profesión y nivel.",
  },
  {
    icon: Gauge,
    title: "Evaluación",
    text: "Comunicación, claridad, seguridad y conocimiento técnico, medidos en vivo.",
  },
  {
    icon: Sparkles,
    title: "Feedback",
    text: "Fortalezas, debilidades y un plan de mejora personalizado al terminar.",
  },
  {
    icon: LineChart,
    title: "Progreso",
    text: "Dashboard, rachas y comparación histórica para seguir mejorando.",
  },
];

export function LandingPage() {
  const [open, setOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onPointerDown = (e: PointerEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("scroll", close, { passive: true });
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("scroll", close);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  return (
    <div className="app-backdrop min-h-screen overflow-x-hidden">
      {/* Header */}
      <header ref={headerRef} className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="flex items-center justify-between px-4 py-3.5 sm:px-6">
          <Brand />
          <div className="flex items-center gap-2">
            <nav className="mr-1 hidden items-center gap-6 text-sm text-muted-foreground md:flex">
              <a href="#features" className="hover:text-foreground">
                Producto
              </a>
              <a href="#profesiones" className="hover:text-foreground">
                Profesiones
              </a>
              <Link to="/precios" className="hover:text-foreground">
                Precios
              </Link>
            </nav>
            <ThemeToggle />
            <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
              <Link to="/login">Iniciar sesión</Link>
            </Button>
            <Button asChild size="sm" className="hidden md:inline-flex">
              <Link to="/register">Empezar gratis</Link>
            </Button>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={open}
              className="grid h-9 w-9 place-items-center rounded-md text-foreground hover:bg-secondary md:hidden"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="border-t border-border/60 bg-background md:hidden">
            <nav className="flex flex-col gap-1 px-4 py-3 text-sm sm:px-6">
              <a href="#features" onClick={() => setOpen(false)} className="rounded-md px-2 py-2 text-muted-foreground hover:bg-secondary hover:text-foreground">
                Producto
              </a>
              <a href="#profesiones" onClick={() => setOpen(false)} className="rounded-md px-2 py-2 text-muted-foreground hover:bg-secondary hover:text-foreground">
                Profesiones
              </a>
              <Link to="/precios" onClick={() => setOpen(false)} className="rounded-md px-2 py-2 text-muted-foreground hover:bg-secondary hover:text-foreground">
                Precios
              </Link>
              <div className="mt-2 flex flex-col gap-2">
                <Button asChild variant="outline" className="w-full" onClick={() => setOpen(false)}>
                  <Link to="/login">Iniciar sesión</Link>
                </Button>
                <Button asChild className="w-full" onClick={() => setOpen(false)}>
                  <Link to="/register">Empezar gratis</Link>
                </Button>
              </div>
            </nav>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-6xl px-4">
        {/* Hero */}
        <section className="grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-2 lg:py-24">
          <div className="rise">
            <span className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-sm font-medium text-accent-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />{" "}
              Simulación impulsada por IA
            </span>
            <h1 className="mt-5 font-display text-4xl font-bold leading-[1.08] sm:text-5xl">
              Practica la entrevista<span className="text-primary">.</span>
              <br />
              Consigue el trabajo<span className="text-primary">.</span>
            </h1>
            <p className="mt-5 max-w-md text-lg text-muted-foreground">
              Simulaciones realistas para cualquier profesión, con análisis de
              tu desempeño y un plan de mejora personalizado. De practicante a
              gerente, en cualquier sector.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link to="/register">Empezar simulación</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
                <a href="#features">Ver cómo funciona</a>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span>+20 profesiones</span>
              <span className="text-border">·</span>
              <span>6 niveles de seniority</span>
              <span className="text-border">·</span>
              <span>Español · Inglés · +2</span>
            </div>
          </div>

          {/* Signature: live interview mock */}
          <div className="relative rise">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-xl">
              <div className="flex items-center gap-3 border-b border-border pb-4">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-xs font-semibold text-primary-foreground">
                  IA
                </span>
                <div className="leading-tight">
                  <p className="text-sm font-semibold">
                    Entrevista · Desarrollo de Software
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Nivel Senior · Técnica
                  </p>
                </div>
                <span className="ml-auto font-mono text-xs tabular text-muted-foreground">
                  12:48
                </span>
              </div>
              <div className="space-y-3 pt-4">
                <div className="max-w-[88%] rounded-2xl rounded-tl-sm bg-secondary px-4 py-3 text-sm">
                  ¿Cómo abordas el diseño de un sistema cuando recibes un
                  requerimiento nuevo?
                </div>
                <div className="ml-auto max-w-[88%] rounded-2xl rounded-br-sm bg-primary px-4 py-3 text-sm text-primary-foreground">
                  Empiezo por aclarar requisitos y restricciones, luego defino
                  los límites del sistema y sus componentes…
                </div>
              </div>
            </div>

            <div className="absolute -bottom-6 -left-4 w-60 rounded-xl border border-border bg-card p-4 shadow-lg sm:-left-8">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Evaluación en vivo
              </p>
              <Meter label="Claridad" value={82} tone="bg-primary" />
              <Meter label="Seguridad" value={76} tone="bg-green-500" />
            </div>
          </div>
        </section>

        {/* Professions */}
        <section id="profesiones" className="py-14 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Para cualquier profesión
          </p>
          <div className="mx-auto mt-6 flex max-w-5xl flex-wrap justify-center gap-2.5">
            {professions.map((p) => (
              <span
                key={p}
                className="rounded-full border border-border bg-card px-4 py-2 text-sm text-card-foreground transition-colors hover:border-primary/50 hover:text-primary"
              >
                {p}
              </span>
            ))}
          </div>
        </section>

        {/* Features */}
        <section
          id="features"
          className="grid gap-5 py-10 sm:grid-cols-2 lg:grid-cols-4"
        >
          {features.map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-accent-foreground">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-5 font-display text-lg font-semibold">
                {title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </section>

        {/* CTA band */}
        <section id="cta" className="py-12">
          <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-16 text-center text-primary-foreground">
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage:
                  "radial-gradient(30rem 30rem at 90% -20%, hsl(var(--gold) / 0.3), transparent 60%)",
              }}
            />
            <div className="relative">
              <h2 className="font-display text-3xl font-semibold sm:text-4xl">
                Tu próxima entrevista empieza aquí
              </h2>
              <p className="mx-auto mt-3 max-w-md text-primary-foreground/85">
                Configura una simulación en menos de un minuto.
              </p>
              <Button asChild size="lg" variant="secondary" className="mt-7">
                <Link to="/register">
                  Crear mi entrevista <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-7 text-sm text-muted-foreground">
          <span>© 2026 InterviewAI</span>
          <div className="flex gap-6">
            <a href="#" className="hover:text-foreground">
              Privacidad
            </a>
            <a href="#" className="hover:text-foreground">
              Términos
            </a>
            <a href="#" className="hover:text-foreground">
              Contacto
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Meter({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className="mt-3 first:mt-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono font-semibold tabular">{value}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-secondary">
        <div
          className={`h-full rounded-full ${tone}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
