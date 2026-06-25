import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Flame, Star, Rocket, CalendarCheck, Medal, Award, Zap, Sparkles, Crown, Trophy,
  TrendingUp, MessageSquare, Brain, Lightbulb, BookOpen, Users, Languages, Mic, Check,
  type LucideIcon,
} from "lucide-react";
import { getGamification, type Achievement } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const ACH_ICONS: Record<string, LucideIcon> = {
  primer_paso: Rocket, dedicado: CalendarCheck, veterano: Medal, constante: Flame, imparable: Award,
  veloz: Zap, notable: Star, excelencia: Sparkles, perfeccion: Crown, maestria: Trophy, ascenso: TrendingUp,
  comunicador: MessageSquare, pensador: Brain, resolutivo: Lightbulb, experto: BookOpen, lider: Users,
  poliglota: Languages, conversador: Mic,
};

const TIER_LABEL: Record<string, string> = { BRONCE: "Bronce", PLATA: "Plata", ORO: "Oro" };
const TIER_BADGE: Record<string, string> = {
  BRONCE: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  PLATA: "bg-slate-400/20 text-slate-600 dark:text-slate-300",
  ORO: "bg-gold/15 text-gold",
};
const TIER_BAR: Record<string, string> = {
  BRONCE: "bg-amber-500", PLATA: "bg-slate-400", ORO: "bg-gold",
};

const CHEST_STEP = 4;

export function LogrosPage() {
  const { data, isLoading } = useQuery({ queryKey: ["gamification"], queryFn: getGamification });
  const [filter, setFilter] = useState("Todos");

  const categories = useMemo(() => {
    if (!data) return ["Todos"];
    return ["Todos", ...Array.from(new Set(data.achievements.map((a) => a.category)))];
  }, [data]);

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-40" />
        <div className="grid gap-5 sm:grid-cols-3">
          <Skeleton className="h-36" /><Skeleton className="h-36" /><Skeleton className="h-36" />
        </div>
        <Skeleton className="h-9 w-72" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-44" />)}
        </div>
      </div>
    );
  }

  const unlocked = data.achievements.filter((a) => a.unlocked).length;
  const total = data.achievements.length;
  const nextChest = Math.min(Math.ceil((unlocked + 1) / CHEST_STEP) * CHEST_STEP, total);
  const missing = Math.max(0, nextChest - unlocked);
  const unlockedPct = total > 0 ? Math.round((unlocked / total) * 100) : 0;

  const shown = filter === "Todos" ? data.achievements : data.achievements.filter((a) => a.category === filter);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Gamificación</p>
        <h1 className="text-2xl font-semibold sm:text-3xl">Logros</h1>
        <p className="mt-1 text-muted-foreground">Desbloquea insignias practicando y mejorando tu desempeño.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {/* Achievement progress */}
        <div className="rounded-2xl bg-linear-to-br from-primary to-primary/80 p-6 text-primary-foreground shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary-foreground/80">Progreso de logros</p>
          <p className="mt-2 font-display text-3xl font-bold">
            <span className="font-mono tabular">{unlocked}</span>
            <span className="text-xl font-medium text-primary-foreground/70"> / {total} desbloqueados</span>
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-primary-foreground/20">
            <div className="h-full rounded-full bg-primary-foreground transition-[width] duration-700"
              style={{ width: `${unlockedPct}%` }} />
          </div>
          <p className="mt-3 text-sm text-primary-foreground/80">
            {missing > 0
              ? `Te faltan ${missing} ${missing === 1 ? "logro" : "logros"} para el siguiente cofre de recompensa`
              : "¡Has desbloqueado todos los logros!"}
          </p>
        </div>

        {/* Streak */}
        <StatCard icon={Flame} iconClass="text-gold">
          <p className="font-display text-3xl font-bold">
            <span className="font-mono tabular">{data.streakDays}</span> {data.streakDays === 1 ? "día" : "días"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">Racha actual · récord {data.bestStreak}</p>
        </StatCard>

        {/* Total XP */}
        <StatCard icon={Star} iconClass="text-gold">
          <p className="font-display text-3xl font-bold font-mono tabular">{data.xp.toLocaleString()}</p>
          <p className="mt-1 text-sm text-muted-foreground">XP acumulada total</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Nivel {data.level} · {data.levelName}</p>
        </StatCard>
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <button key={c} onClick={() => setFilter(c)}
            className={cn("rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
              filter === c
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:border-primary/50")}>
            {c}
          </button>
        ))}
      </div>

      {/* Achievement grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {shown.map((a) => <AchievementCard key={a.key} achievement={a} />)}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, iconClass, children }: {
  icon: LucideIcon; iconClass?: string; children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col justify-center rounded-2xl border border-border bg-card p-6 shadow-sm">
      <span className={cn("mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-secondary", iconClass)}>
        <Icon className="h-5 w-5" />
      </span>
      {children}
    </div>
  );
}

function AchievementCard({ achievement: a }: { achievement: Achievement }) {
  const Icon = ACH_ICONS[a.key] ?? Trophy;
  const pct = a.target > 0 ? Math.round((a.progress / a.target) * 100) : 0;
  return (
    <div className={cn(
      "flex h-full flex-col rounded-xl border bg-card p-5 transition-all",
      a.unlocked ? "border-primary/30" : "border-border",
    )}>
      <div className="flex items-start justify-between">
        <span className={cn("grid h-11 w-11 place-items-center rounded-xl",
          a.unlocked ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground")}>
          <Icon className="h-5 w-5" />
        </span>
        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
          TIER_BADGE[a.tier] ?? TIER_BADGE.BRONCE)}>
          {TIER_LABEL[a.tier] ?? a.tier}
        </span>
      </div>

      <p className={cn("mt-4 font-display font-semibold", !a.unlocked && "text-foreground/90")}>{a.title}</p>
      <p className="mt-0.5 flex-1 text-sm text-muted-foreground">{a.description}</p>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-secondary">
        <div className={cn("h-full rounded-full transition-[width] duration-700",
          a.unlocked ? TIER_BAR[a.tier] ?? "bg-primary" : "bg-muted-foreground/40")}
          style={{ width: `${pct}%` }} />
      </div>

      <div className="mt-2.5 flex items-center justify-between text-xs">
        <span className={cn("flex items-center gap-1 font-medium",
          a.unlocked ? "text-green-600 dark:text-green-400" : "text-muted-foreground")}>
          {a.unlocked
            ? <><Check className="h-3.5 w-3.5" /> Completado</>
            : a.target > 1 ? <span className="font-mono tabular">{a.progress}/{a.target}</span> : "Bloqueado"}
        </span>
        <span className="font-mono font-semibold tabular text-muted-foreground">+{a.xpReward} XP</span>
      </div>
    </div>
  );
}
