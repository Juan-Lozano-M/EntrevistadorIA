import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Clock, Sparkles, X } from "lucide-react";
import { getStatsOverview } from "@/lib/api";
import { DIMENSION_LABELS } from "@/lib/dimensions";
import { RESOURCES, type Resource } from "./resources";
import { cn } from "@/lib/utils";

export function RecursosPage() {
  const { data: overview } = useQuery({ queryKey: ["overview"], queryFn: getStatsOverview });
  const [filter, setFilter] = useState<string>("all");
  const [active, setActive] = useState<Resource | null>(null);

  // Weakest dimensions drive the recommendations.
  const weakest = useMemo(() => {
    const entries = Object.entries(overview?.dimensionAverages ?? {});
    return entries.sort((a, b) => a[1] - b[1]).slice(0, 2).map(([d]) => d);
  }, [overview]);

  const recommended = useMemo(() => {
    if (weakest.length === 0) return [];
    return RESOURCES.filter((r) => r.dimensions.some((d) => weakest.includes(d))).slice(0, 4);
  }, [weakest]);

  const filterOptions = useMemo(() => {
    const present = new Set<string>();
    RESOURCES.forEach((r) => r.dimensions.forEach((d) => present.add(d)));
    return ["all", ...Array.from(present)];
  }, []);

  const library = filter === "all" ? RESOURCES : RESOURCES.filter((r) => r.dimensions.includes(filter));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold sm:text-3xl">Recursos</h1>
        <p className="mt-1 text-muted-foreground">Guías para preparar tus entrevistas.</p>
      </div>

      {recommended.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="font-display text-lg font-semibold">Recomendado para ti</h2>
          </div>
          <p className="-mt-1 text-sm text-muted-foreground">
            Según tus competencias a reforzar: {weakest.map((d) => DIMENSION_LABELS[d] ?? d).join(", ")}.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {recommended.map((r) => <ResourceCard key={r.id} resource={r} onOpen={() => setActive(r)} highlighted />)}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">Biblioteca</h2>
        <div className="flex flex-wrap gap-2">
          {filterOptions.map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn("rounded-full border px-3 py-1 text-sm font-medium transition-colors",
                filter === f ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:border-primary/50")}>
              {f === "all" ? "Todas" : DIMENSION_LABELS[f] ?? f}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {library.map((r) => <ResourceCard key={r.id} resource={r} onOpen={() => setActive(r)} />)}
        </div>
      </section>

      {active && <ResourceModal resource={active} onClose={() => setActive(null)} />}
    </div>
  );
}

function ResourceCard({ resource: r, onOpen, highlighted }: {
  resource: Resource; onOpen: () => void; highlighted?: boolean;
}) {
  return (
    <button onClick={onOpen}
      className={cn("flex h-full flex-col rounded-xl border bg-card p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-md",
        highlighted ? "border-primary/40" : "border-border")}>
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-accent-foreground">
        <BookOpen className="h-5 w-5" />
      </span>
      <h3 className="mt-4 font-display font-semibold leading-snug">{r.title}</h3>
      <p className="mt-1 flex-1 text-sm text-muted-foreground">{r.summary}</p>
      <span className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <Clock className="h-3.5 w-3.5" /> {r.readMinutes} min de lectura
      </span>
    </button>
  );
}

function ResourceModal({ resource: r, onClose }: { resource: Resource; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="app-overlay absolute inset-0" onClick={onClose} />
      <div className="relative z-10 max-h-[85dvh] w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-border p-5">
          <div>
            <h2 className="font-display text-xl font-semibold">{r.title}</h2>
            <span className="mt-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" /> {r.readMinutes} min
            </span>
          </div>
          <button onClick={onClose} aria-label="Cerrar"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-secondary">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="scrollbar-slim max-h-[60dvh] space-y-3 overflow-y-auto p-5 text-sm leading-relaxed text-muted-foreground">
          {r.body.map((p, i) => <p key={i}>{p}</p>)}
          {r.dimensions.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {r.dimensions.map((d) => (
                <span key={d} className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                  {DIMENSION_LABELS[d] ?? d}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
