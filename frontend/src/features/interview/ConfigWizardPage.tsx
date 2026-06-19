import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getProfessions, getOptions, createInterview, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const LEVEL_LABELS: Record<string, string> = {
  INTERN: "Practicante", JUNIOR: "Junior", SEMI_SENIOR: "Semi Senior",
  SENIOR: "Senior", LEAD: "Líder", MANAGER: "Gerente",
};
const TYPE_LABELS: Record<string, string> = {
  TECHNICAL: "Técnica", HR: "Recursos Humanos", SITUATIONAL: "Situacional",
  COMPETENCY: "Competencias", LEADERSHIP: "Liderazgo", MIXED: "Mixta",
};

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

  if (professions.isLoading || options.isLoading) return <p>Cargando…</p>;

  return (
    <Card className="mx-auto max-w-xl">
      <CardHeader><CardTitle>Configura tu entrevista</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="profession">Profesión</Label>
            <select id="profession" className="w-full rounded-md border bg-background p-2"
              value={form.professionSlug}
              onChange={(e) => setForm({ ...form, professionSlug: e.target.value })}>
              {professions.data!.map((p) => <option key={p.slug} value={p.slug}>{p.name}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="role">Cargo</Label>
            <Input id="role" value={form.roleTitle}
              onChange={(e) => setForm({ ...form, roleTitle: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="company">Empresa (opcional)</Label>
              <Input id="company" value={form.targetCompany}
                onChange={(e) => setForm({ ...form, targetCompany: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="industry">Industria (opcional)</Label>
              <Input id="industry" value={form.industry}
                onChange={(e) => setForm({ ...form, industry: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="level">Nivel</Label>
              <select id="level" className="w-full rounded-md border bg-background p-2"
                value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
                {options.data!.levels.map((l) => <option key={l} value={l}>{LEVEL_LABELS[l] ?? l}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="type">Tipo</Label>
              <select id="type" className="w-full rounded-md border bg-background p-2"
                value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {options.data!.types.map((t) => <option key={t} value={t}>{TYPE_LABELS[t] ?? t}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="language">Idioma</Label>
              <select id="language" className="w-full rounded-md border bg-background p-2"
                value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })}>
                <option value="es">Español</option>
                <option value="en">Inglés</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="duration">Duración (min)</Label>
              <Input id="duration" type="number" min={5} max={120} value={form.durationMinutes}
                onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })} />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            Comenzar entrevista
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
