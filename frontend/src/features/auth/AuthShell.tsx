import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Brand } from "@/components/Brand";
import { ThemeToggle } from "@/components/ThemeToggle";

type Props = {
  children: ReactNode;
  /** Marketing panel copy (left). */
  heading: ReactNode;
  paragraph: string;
  /** Top-right switch to the other auth page. */
  altPrompt: string;
  altText: string;
  altTo: string;
};

const CHIPS = ["+20 profesiones", "Feedback con IA", "100% en español"];

// The signature element: a miniature scored-interview result — the product's core artifact.
function ResultPreview() {
  const bars = [0.9, 0.7, 0.85, 0.5, 0.75, 0.95, 0.6, 0.8];
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/15 text-xs font-semibold">IA</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Entrevista completada</p>
          <p className="truncate text-xs text-primary-foreground/70">Desarrollo de Software · Senior</p>
        </div>
        <span className="font-mono text-2xl font-bold">82</span>
      </div>
      <div className="mt-4 flex items-end gap-1.5">
        {bars.map((f, i) => (
          <span key={i} className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/20">
            <span className="block h-full rounded-full bg-white" style={{ width: `${f * 100}%` }} />
          </span>
        ))}
      </div>
    </div>
  );
}

export function AuthShell({ children, heading, paragraph, altPrompt, altText, altTo }: Props) {
  return (
    <div className="grid min-h-dvh bg-background lg:grid-cols-2">
      {/* Marketing panel */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex">
        <div className="pointer-events-none absolute -right-24 -top-24 h-136 w-136 rounded-full bg-white/10" />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(30rem 30rem at 80% 0%, hsl(var(--gold) / 0.18), transparent 60%), radial-gradient(28rem 28rem at 0% 100%, rgb(255 255 255 / 0.10), transparent 55%)",
          }}
        />
        <div className="relative">
          <Brand className="[&_span]:text-primary-foreground [&_.text-primary]:text-[hsl(var(--gold))]" />
        </div>
        <div className="relative max-w-md space-y-6">
          <h1 className="font-display text-4xl font-bold leading-[1.1]">{heading}</h1>
          <p className="text-primary-foreground/80">{paragraph}</p>
          <ResultPreview />
        </div>
        <div className="relative flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-primary-foreground/70">
          {CHIPS.map((c, i) => (
            <span key={c} className="flex items-center gap-3">
              {i > 0 && <span className="text-primary-foreground/40">·</span>}{c}
            </span>
          ))}
        </div>
      </aside>

      {/* Form side */}
      <div className="flex min-h-dvh flex-col">
        <header className="flex items-center justify-end gap-3 px-6 py-4 sm:px-8">
          <span className="hidden text-sm text-muted-foreground sm:inline">{altPrompt}</span>
          <Link to={altTo}
            className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-secondary">
            {altText}
          </Link>
          <ThemeToggle />
        </header>

        <div className="flex flex-1 items-center justify-center px-6 py-4 sm:px-8">
          <div className="rise w-full max-w-md">
            <div className="mb-6 lg:hidden"><Brand /></div>
            {children}
          </div>
        </div>

        <footer className="px-6 py-3 text-center text-xs text-muted-foreground sm:px-8">
          © {new Date().getFullYear()} InterviewAI · Hecho para profesionales de cualquier sector
        </footer>
      </div>
    </div>
  );
}
