import { useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  User as UserIcon, SlidersHorizontal, Palette, Bell, Star, Shield,
  Crown, LogOut, Trash2, Sun, Moon, X, ChevronDown, type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  getProfessions, getMe, updateName, updateNotifications, sendTestEmail, changePassword, deleteAccount,
  cancelSubscription, ApiError, type NotificationPrefs,
} from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { useSettingsStore, ACCENT_DOT, type Accent } from "@/stores/settingsStore";
import { useTheme } from "@/theme/ThemeProvider";
import { LEVEL_LABELS } from "@/lib/labels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordRevealButton } from "@/components/PasswordRevealButton";
import { cn } from "@/lib/utils";

type Section = "perfil" | "preferencias" | "apariencia" | "notificaciones" | "suscripcion" | "cuenta";

const TABS: { id: Section; label: string; icon: LucideIcon }[] = [
  { id: "perfil", label: "Perfil", icon: UserIcon },
  { id: "preferencias", label: "Preferencias", icon: SlidersHorizontal },
  { id: "apariencia", label: "Apariencia", icon: Palette },
  { id: "notificaciones", label: "Notificaciones", icon: Bell },
  { id: "suscripcion", label: "Suscripción", icon: Star },
  { id: "cuenta", label: "Cuenta", icon: Shield },
];

export function ConfiguracionPage() {
  const [section, setSection] = useState<Section>("perfil");

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Ajustes</p>
        <h1 className="text-2xl font-semibold sm:text-3xl">Configuración</h1>
        <p className="mt-1 text-muted-foreground">Administra tu perfil, preferencias y suscripción.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[220px_1fr] lg:gap-6">
        {/* Tabs — dropdown on mobile, vertical list on desktop */}
        <div className="relative lg:hidden">
          <select value={section} onChange={(e) => setSection(e.target.value as Section)}
            aria-label="Sección de configuración"
            className="h-11 w-full appearance-none rounded-lg border border-input bg-card pl-3 pr-10 text-sm font-medium">
            {TABS.map(({ id, label }) => <option key={id} value={id}>{label}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        </div>

        <nav className="hidden lg:flex lg:flex-col lg:gap-2">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setSection(id)}
              className={cn("flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                section === id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground")}>
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </nav>

        {/* Panel */}
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-7">
          {section === "perfil" && <PerfilSection />}
          {section === "preferencias" && <PreferenciasSection />}
          {section === "apariencia" && <AparienciaSection />}
          {section === "notificaciones" && <NotificacionesSection />}
          {section === "suscripcion" && <SuscripcionSection />}
          {section === "cuenta" && <CuentaSection />}
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-6">
      <h2 className="font-display text-xl font-semibold">{title}</h2>
      <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function SettingRow({ title, desc, children, compact }: {
  title: string; desc?: string; children: ReactNode; compact?: boolean;
}) {
  return (
    <div className={cn("gap-3 border-t border-border py-5 first:border-t-0 first:pt-0",
      compact
        ? "flex items-center justify-between"
        : "flex flex-col sm:flex-row sm:items-center sm:justify-between")}>
      <div className="min-w-0">
        <p className="font-medium">{title}</p>
        {desc && <p className="text-sm text-muted-foreground">{desc}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Segmented<T extends string>({ options, value, onChange }: {
  options: { value: T; label: string }[]; value: T; onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button key={o.value} onClick={() => onChange(o.value)}
          className={cn("rounded-lg border px-3.5 py-1.5 text-sm font-medium transition-colors",
            value === o.value
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border text-muted-foreground hover:border-primary/50")}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
      className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors",
        checked ? "bg-primary" : "bg-secondary")}>
      <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200"
        style={{ transform: checked ? "translateX(20px)" : "translateX(0)" }} />
    </button>
  );
}

// ---------------- Perfil ----------------
function PerfilSection() {
  const { user, setName } = useAuthStore();
  const { professionSlug, level, setPreferences } = useSettingsStore();
  const professions = useQuery({ queryKey: ["professions"], queryFn: getProfessions });

  const [name, setLocalName] = useState(user?.name ?? "");
  const [prof, setProf] = useState(professionSlug);
  const [lvl, setLvl] = useState(level);

  const dirty = name.trim() !== (user?.name ?? "") || prof !== professionSlug || lvl !== level;

  const save = useMutation({
    mutationFn: () => updateName(name.trim()),
    onSuccess: (acc) => {
      setName(acc.name);
      setPreferences({ professionSlug: prof, level: lvl });
      toast.success("Perfil actualizado");
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "No se pudo guardar"),
  });

  const reset = () => { setLocalName(user?.name ?? ""); setProf(professionSlug); setLvl(level); };

  return (
    <div>
      <SectionHeader title="Perfil" subtitle="Esta información se usa para personalizar tus simulaciones." />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Nombre completo">
          <Input value={name} onChange={(e) => setLocalName(e.target.value)} />
        </Field>
        <Field label="Correo electrónico">
          <Input value={user?.email ?? ""} disabled readOnly />
        </Field>
        <Field label="Profesión principal">
          <select value={prof} onChange={(e) => setProf(e.target.value)}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
            <option value="">Sin especificar</option>
            {professions.data?.map((p) => <option key={p.slug} value={p.slug}>{p.name}</option>)}
          </select>
        </Field>
        <Field label="Nivel objetivo">
          <select value={lvl} onChange={(e) => setLvl(e.target.value)}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
            {["JUNIOR", "SEMI_SENIOR", "SENIOR"].map((l) => (
              <option key={l} value={l}>{LEVEL_LABELS[l] ?? l}</option>
            ))}
          </select>
        </Field>
      </div>
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
        <Button variant="ghost" className="w-full sm:w-auto" onClick={reset} disabled={!dirty || save.isPending}>Cancelar</Button>
        <Button className="w-full sm:w-auto" onClick={() => save.mutate()} disabled={!dirty || !name.trim() || save.isPending}>
          Guardar cambios
        </Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

// ---------------- Preferencias ----------------
function PreferenciasSection() {
  const { language, level, type, setPreferences } = useSettingsStore();
  return (
    <div>
      <SectionHeader title="Preferencias de entrevista" subtitle="Valores por defecto al iniciar una nueva simulación." />
      <SettingRow title="Idioma por defecto" desc="Para nuevas entrevistas">
        <Segmented value={language} onChange={(v) => setPreferences({ language: v })}
          options={[{ value: "es", label: "Español" }, { value: "en", label: "Inglés" }]} />
      </SettingRow>
      <SettingRow title="Nivel objetivo" desc="Dificultad inicial">
        <Segmented value={level} onChange={(v) => setPreferences({ level: v })}
          options={[{ value: "JUNIOR", label: "Junior" }, { value: "SEMI_SENIOR", label: "Semi Senior" }, { value: "SENIOR", label: "Senior" }]} />
      </SettingRow>
      <SettingRow title="Tipo preferido" desc="Enfoque de las preguntas">
        <Segmented value={type} onChange={(v) => setPreferences({ type: v })}
          options={[{ value: "TECHNICAL", label: "Técnica" }, { value: "MIXED", label: "Mixta" }, { value: "COMPETENCY", label: "Competencias" }]} />
      </SettingRow>
    </div>
  );
}

// ---------------- Apariencia ----------------
function AparienciaSection() {
  const { theme, toggleTheme } = useTheme();
  const { accent, setAccent } = useSettingsStore();
  const accents: Accent[] = ["default", "azul", "purpura", "verde"];
  return (
    <div>
      <SectionHeader title="Apariencia" subtitle="Personaliza cómo se ve InterviewAI." />
      <SettingRow title="Tema" desc="Claro u oscuro">
        <div className="flex gap-2">
          <button onClick={() => { if (theme === "dark") toggleTheme(); }}
            className={cn("flex items-center gap-1.5 rounded-lg border px-3.5 py-1.5 text-sm font-medium",
              theme === "light" ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground")}>
            <Sun className="h-4 w-4" /> Claro
          </button>
          <button onClick={() => { if (theme === "light") toggleTheme(); }}
            className={cn("flex items-center gap-1.5 rounded-lg border px-3.5 py-1.5 text-sm font-medium",
              theme === "dark" ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground")}>
            <Moon className="h-4 w-4" /> Oscuro
          </button>
        </div>
      </SettingRow>
      <SettingRow title="Color de acento" desc="Define el color principal de la interfaz">
        <div className="flex gap-2.5">
          {accents.map((a) => (
            <button key={a} onClick={() => setAccent(a)} aria-label={`Acento ${a}`}
              className={cn("h-8 w-8 rounded-lg ring-offset-2 ring-offset-card transition-all",
                accent === a ? "ring-2 ring-foreground" : "ring-1 ring-border hover:ring-foreground/40")}
              style={{ backgroundColor: ACCENT_DOT[a] }} />
          ))}
        </div>
      </SettingRow>
    </div>
  );
}

// ---------------- Notificaciones ----------------
function NotificacionesSection() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["account"], queryFn: getMe });
  const prefs = data?.notifications;

  const mut = useMutation({
    mutationFn: (next: NotificationPrefs) => updateNotifications(next),
    onMutate: async (next) => {
      await qc.cancelQueries({ queryKey: ["account"] });
      const prev = qc.getQueryData<typeof data>(["account"]);
      if (prev) qc.setQueryData(["account"], { ...prev, notifications: next });
      return { prev };
    },
    onError: (e, _next, ctx) => {
      if (ctx?.prev) qc.setQueryData(["account"], ctx.prev);
      toast.error(e instanceof ApiError ? e.message : "No se pudo actualizar");
    },
    onSuccess: (acc) => qc.setQueryData(["account"], acc),
  });

  const test = useMutation({
    mutationFn: sendTestEmail,
    onSuccess: (r) => r.sent
      ? toast.success("Correo de prueba enviado. Revisa tu bandeja.")
      : toast.error("No se pudo enviar. Revisa RESEND_API_KEY y que tu correo coincida con el de tu cuenta de Resend."),
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "No se pudo enviar el correo"),
  });

  const items: { key: keyof NotificationPrefs; title: string; desc: string }[] = [
    { key: "daily", title: "Recordatorio diario", desc: "Te avisamos para mantener tu racha de práctica." },
    { key: "weekly", title: "Resumen semanal", desc: "Un email con tu progreso y áreas de mejora." },
    { key: "achievements", title: "Logros desbloqueados", desc: "Notificación cuando ganes una nueva insignia." },
    { key: "product", title: "Novedades del producto", desc: "Nuevas funciones y recursos. Sin spam." },
  ];

  return (
    <div>
      <SectionHeader title="Notificaciones" subtitle="Elige qué recordatorios quieres recibir por correo." />
      {items.map((it) => (
        <SettingRow key={it.key} title={it.title} desc={it.desc} compact>
          <Switch
            checked={prefs ? prefs[it.key] : false}
            onChange={(v) => prefs && !isLoading && mut.mutate({ ...prefs, [it.key]: v })}
          />
        </SettingRow>
      ))}
      <div className="mt-5 flex flex-col gap-2 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">¿Quieres comprobar que llegan? Te enviamos un correo de prueba.</p>
        <Button variant="outline" className="w-full shrink-0 sm:w-auto"
          onClick={() => test.mutate()} disabled={test.isPending}>
          Enviar correo de prueba
        </Button>
      </div>
    </div>
  );
}

// ---------------- Suscripción ----------------
function SuscripcionSection() {
  const navigate = useNavigate();
  const { user, setPlan } = useAuthStore();
  const isPremium = user?.plan === "PREMIUM";
  const [confirmCancel, setConfirmCancel] = useState(false);
  const { data: account } = useQuery({ queryKey: ["account"], queryFn: getMe });

  const cancel = useMutation({
    mutationFn: cancelSubscription,
    onSuccess: () => { setPlan("FREE"); setConfirmCancel(false); toast.success("Suscripción cancelada"); },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "No se pudo cancelar"),
  });

  return (
    <div>
      <SectionHeader title="Suscripción" subtitle="Tu plan actual y sus beneficios." />
      <div className={cn("rounded-xl border p-5", isPremium ? "border-gold/30 bg-gold/5" : "border-border")}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-xl",
              isPremium ? "bg-gold/15 text-gold" : "bg-secondary text-muted-foreground")}>
              <Crown className="h-5 w-5" />
            </span>
            <div>
              <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
                isPremium ? "bg-gold/15 text-gold" : "bg-secondary text-muted-foreground")}>
                {isPremium ? "Plan Premium" : "Plan Free"}
              </span>
              <p className="mt-1 font-display text-lg font-semibold">
                {isPremium ? "Entrevistas ilimitadas + chat y voz con IA" : "Entrevistas estándar"}
              </p>
              <p className="text-sm text-muted-foreground">
                {isPremium ? "Suscripción mensual activa. Acceso a todas las modalidades." : "3 entrevistas al día. Suscríbete para desbloquear chat, voz e ilimitadas."}
              </p>
              {isPremium && account?.card && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Tarjeta:{" "}
                  <span className="font-medium text-foreground">{account.card.brand || "Tarjeta"} •••• {account.card.last4}</span>
                  {" "}· se usa para la renovación mensual.
                </p>
              )}
            </div>
          </div>
          {!isPremium && (
            <Button onClick={() => navigate("/precios")}
              className="w-full shrink-0 bg-gold text-gold-foreground hover:bg-gold/90 sm:w-auto">
              <Crown className="h-4 w-4" /> Suscribirme a Premium
            </Button>
          )}
        </div>
      </div>

      {isPremium && (
        <div className="mt-4 flex flex-col gap-3 rounded-xl border border-border p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="font-medium">Cancelar suscripción</p>
            <p className="text-sm text-muted-foreground">Se detendrán los cobros y volverás al plan Free.</p>
          </div>
          {confirmCancel ? (
            <div className="flex shrink-0 gap-2">
              <Button variant="ghost" className="flex-1 sm:flex-none" onClick={() => setConfirmCancel(false)} disabled={cancel.isPending}>Volver</Button>
              <Button onClick={() => cancel.mutate()} disabled={cancel.isPending}
                className="flex-1 bg-destructive text-white hover:bg-destructive/90 sm:flex-none">Confirmar</Button>
            </div>
          ) : (
            <Button variant="outline" className="w-full shrink-0 sm:w-auto" onClick={() => setConfirmCancel(true)}>
              Cancelar suscripción
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------- Cuenta ----------------
function CuentaSection() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const [showPw, setShowPw] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const del = useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => { toast.success("Cuenta eliminada"); logout(); navigate("/login"); },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "No se pudo eliminar la cuenta"),
  });

  return (
    <div className="space-y-6">
      <div>
        <SectionHeader title="Seguridad" subtitle="Protege el acceso a tu cuenta." />
        <SettingRow title="Contraseña" desc="Cámbiala periódicamente para mayor seguridad." compact>
          <Button variant="outline" onClick={() => setShowPw(true)}>Cambiar</Button>
        </SettingRow>
        <SettingRow title="Cerrar sesión" desc="Cierra tu sesión en este dispositivo." compact>
          <Button variant="outline" size="icon" className="sm:hidden" onClick={() => { logout(); navigate("/login"); }}
            aria-label="Cerrar sesión">
            <LogOut className="h-4 w-4" />
          </Button>
          <Button variant="outline" className="hidden sm:inline-flex" onClick={() => { logout(); navigate("/login"); }}>
            <LogOut className="h-4 w-4" /> Cerrar sesión
          </Button>
        </SettingRow>
      </div>

      {showPw && <PasswordModal onClose={() => setShowPw(false)} />}

      <div className="rounded-xl border border-destructive/40 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="font-medium text-destructive">Eliminar cuenta</p>
            <p className="text-sm text-muted-foreground">Se borrará tu historial, progreso y logros de forma permanente.</p>
          </div>
          {confirmDelete ? (
            <div className="flex shrink-0 gap-2">
              <Button variant="ghost" className="flex-1 sm:flex-none" onClick={() => setConfirmDelete(false)} disabled={del.isPending}>Cancelar</Button>
              <Button onClick={() => del.mutate()} disabled={del.isPending}
                className="flex-1 bg-destructive text-white hover:bg-destructive/90 sm:flex-none">
                <Trash2 className="h-4 w-4" /> Confirmar
              </Button>
            </div>
          ) : (
            <Button variant="outline" onClick={() => setConfirmDelete(true)}
              className="w-full border-destructive/50 text-destructive hover:bg-destructive/10 sm:w-auto">
              <Trash2 className="h-4 w-4" /> Eliminar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function PasswordModal({ onClose }: { onClose: () => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const pw = useMutation({
    mutationFn: () => changePassword(current, next),
    onSuccess: () => { toast.success("Contraseña actualizada"); onClose(); },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "No se pudo cambiar la contraseña"),
  });

  const canChange = current.length > 0 && next.length >= 6 && next === confirm;

  return createPortal(
    <div className="fixed inset-0 z-60 grid place-items-center overflow-y-auto p-4">
      <div className="app-overlay fixed inset-0" onClick={() => !pw.isPending && onClose()} />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-display text-xl font-semibold">Cambiar contraseña</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">Introduce tu contraseña actual y la nueva.</p>
          </div>
          <button onClick={onClose} aria-label="Cerrar"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-secondary">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form className="mt-5 space-y-4" onSubmit={(e) => { e.preventDefault(); if (canChange) pw.mutate(); }}>
          <Field label="Contraseña actual">
            <div className="relative">
              <Input type={showCurrent ? "text" : "password"} className="pr-10" value={current}
                onChange={(e) => setCurrent(e.target.value)} autoFocus />
              <PasswordRevealButton onChange={setShowCurrent} />
            </div>
          </Field>
          <Field label="Nueva contraseña (mín. 6)">
            <div className="relative">
              <Input type={showNext ? "text" : "password"} className="pr-10" value={next}
                onChange={(e) => setNext(e.target.value)} />
              <PasswordRevealButton onChange={setShowNext} />
            </div>
          </Field>
          <Field label="Confirmar nueva contraseña">
            <div className="relative">
              <Input type={showConfirm ? "text" : "password"} className="pr-10" value={confirm}
                onChange={(e) => setConfirm(e.target.value)} />
              <PasswordRevealButton onChange={setShowConfirm} />
            </div>
          </Field>
          {next.length > 0 && confirm.length > 0 && next !== confirm && (
            <p className="text-xs text-destructive">Las contraseñas no coinciden.</p>
          )}
          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end sm:gap-3">
            <Button type="button" variant="ghost" className="w-full sm:w-auto" onClick={onClose} disabled={pw.isPending}>Cancelar</Button>
            <Button type="submit" className="w-full sm:w-auto" disabled={!canChange || pw.isPending}>Guardar contraseña</Button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
