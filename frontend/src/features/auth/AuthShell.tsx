import { type ReactNode } from "react";
import { Sparkles, Target, LineChart } from "lucide-react";
import { Brand } from "@/components/Brand";

const points = [
  { icon: Target, text: "Entrevistas a tu medida: cargo, nivel y tipo." },
  { icon: Sparkles, text: "Practica preguntas reales con cronómetro." },
  { icon: LineChart, text: "Reporte con 8 dimensiones y plan de mejora." },
];

/** Split-screen frame for auth: brand value-prop panel + the form. */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-backdrop grid min-h-screen lg:grid-cols-2">
      {/* Brand / value panel */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-90"
          style={{
            backgroundImage:
              "radial-gradient(28rem 28rem at 85% 10%, hsl(var(--gold) / 0.35), transparent 60%), radial-gradient(26rem 26rem at 0% 100%, rgb(255 255 255 / 0.12), transparent 55%)",
          }}
        />
        <div className="relative">
          <Brand className="[&_span]:text-primary-foreground [&_.text-primary]:text-[hsl(var(--gold))]" />
        </div>
        <div className="relative space-y-6">
          <h1 className="font-display text-4xl font-semibold leading-tight">
            Llega a tu entrevista<br />con la práctica hecha.
          </h1>
          <ul className="space-y-3">
            {points.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-primary-foreground/90">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/15">
                  <Icon className="h-5 w-5" />
                </span>
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm text-primary-foreground/70">
          Simulación de entrevistas impulsada por IA · para cualquier profesión.
        </p>
      </aside>

      {/* Form side */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm rise">
          <div className="mb-8 lg:hidden">
            <Brand />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
