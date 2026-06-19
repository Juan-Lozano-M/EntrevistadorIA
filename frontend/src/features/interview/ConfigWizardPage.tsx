import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { getProfessions, getOptions, createInterview, ApiError } from "@/lib/api";
import { LEVEL_LABELS, TYPE_LABELS } from "@/lib/labels";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const selectClass =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function ConfigWizardPage() {
  const navigate = useNavigate();
  const professions = useQuery({ queryKey: ["professions"], queryFn: getProfessions });
  const options = useQuery({ queryKey: ["options"], queryFn: getOptions });

  const [form, setForm] = useState({
    professionSlug: "", roleTitle: "", targetCompany: "", industry: "",
    level: "", type: "", language: "es", durationMinutes: 15,
  });
  const [error, setError] = useState<string | null>(null);

  // Default selects to the first option once data arrives.
  if (professions.data && !form.professionSlug && professions.data.length > 0) {
    setForm((f) => ({ ...f, professionSlug: professions.data![0].slug }));
  }
  if (options.data && !form.level && options.data.levels.length > 0) {
    setForm((f) => ({ ...f, level: options.data!.levels[0], type: options.data!.types[0] }));
  }

  const mutation = useMutation({
    mutationFn: createInterview,
    onSuccess: (s) => { toast.success("Entrevista creada"); navigate(`/interview/${s.id}`); },
    onError: (e) => setError(e instanceof ApiError ? e.message : "Error inesperado"),
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.roleTitle.trim()) { setError("El cargo es obligatorio"); return; }
    mutation.mutate(form);
  };

  if (professions.isLoading || options.isLoading) {
    return <p className="text-muted-foreground">Cargando…</p>;
  }

  return (
    <div className="mx-auto max-w-xl rise">
      <Link to="/" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Volver
      </Link>
      <div className="mb-6">
        <p className="text-sm font-medium text-primary">Nueva entrevista</p>
        <h1 className="text-2xl font-semibold">Configura tu simulación</h1>
        <p className="mt-1 text-muted-foreground">Ajusta el escenario; las preguntas se adaptan a tu elección.</p>
      </div>

      <Card>
        <CardContent className="py-6">
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="profession">Profesión</Label>
              <select id="profession" className={selectClass}
                value={form.professionSlug}
                onChange={(e) => setForm({ ...form, professionSlug: e.target.value })}>
                {professions.data!.map((p) => <option key={p.slug} value={p.slug}>{p.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="role">Cargo</Label>
              <Input id="role" placeholder="p. ej. Backend Developer" value={form.roleTitle}
                onChange={(e) => setForm({ ...form, roleTitle: e.target.value })} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="company">Empresa <span className="text-muted-foreground">(opcional)</span></Label>
                <Input id="company" value={form.targetCompany}
                  onChange={(e) => setForm({ ...form, targetCompany: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="industry">Industria <span className="text-muted-foreground">(opcional)</span></Label>
                <Input id="industry" value={form.industry}
                  onChange={(e) => setForm({ ...form, industry: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="level">Nivel</Label>
                <select id="level" className={selectClass}
                  value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
                  {options.data!.levels.map((l) => <option key={l} value={l}>{LEVEL_LABELS[l] ?? l}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="type">Tipo</Label>
                <select id="type" className={selectClass}
                  value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  {options.data!.types.map((t) => <option key={t} value={t}>{TYPE_LABELS[t] ?? t}</option>)}
                </select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="language">Idioma</Label>
                <select id="language" className={selectClass}
                  value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })}>
                  <option value="es">Español</option>
                  <option value="en">Inglés</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="duration">Duración (min)</Label>
                <Input id="duration" type="number" min={5} max={120} value={form.durationMinutes}
                  onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })} />
              </div>
            </div>
            {error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
            )}
            <Button type="submit" size="lg" className="w-full" disabled={mutation.isPending}>
              Comenzar entrevista
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
