import { useState } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard, ClipboardList, LineChart, BookOpen, Trophy, Settings,
  Menu, X, LogOut, Crown, Flame,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { getGamification } from "@/lib/api";
import { Brand } from "@/components/Brand";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = {
  general: [
    { to: "/app", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/app/entrevistas", label: "Entrevistas", icon: ClipboardList, end: false },
    { to: "/app/progreso", label: "Progreso", icon: LineChart, end: false },
    { to: "/app/recursos", label: "Recursos", icon: BookOpen, end: false },
  ],
  cuenta: [
    { to: "/app/logros", label: "Logros", icon: Trophy, end: false },
    { to: "/app/configuracion", label: "Configuración", icon: Settings, end: false },
  ],
};

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const initial = user?.name?.trim()?.[0]?.toUpperCase() ?? "?";
  const isPremium = user?.plan === "PREMIUM";
  const gam = useQuery({ queryKey: ["gamification"], queryFn: getGamification });
  const streak = gam.data?.streakDays ?? 0;

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn("flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
      isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground");

  return (
    <div className="flex h-full flex-col">
      <div className="px-5 py-4">
        <Brand />
      </div>
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-2">
        {(["general", "cuenta"] as const).map((group) => (
          <div key={group}>
            <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {group === "general" ? "General" : "Cuenta"}
            </p>
            <div className="space-y-1">
              {NAV[group].map(({ to, label, icon: Icon, end }) => (
                <NavLink key={to} to={to} end={end} onClick={onNavigate} className={linkClass}>
                  <Icon className="h-5 w-5" /> {label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
      {gam.data && (
        <div className="mx-3 mb-1 rounded-xl border border-border bg-card p-3">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-gold" />
            <span className="text-sm font-semibold">Racha de {streak} {streak === 1 ? "día" : "días"}</span>
          </div>
          <div className="mt-2 flex gap-1">
            {Array.from({ length: 7 }, (_, i) => (
              <span key={i} className={cn("h-2 flex-1 rounded", i < streak ? "bg-gold" : "bg-secondary")} />
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Practica hoy para no perderla.</p>
        </div>
      )}
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            {initial}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user?.name ?? ""}</p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              {isPremium && <Crown className="h-3 w-3 text-gold" />}{isPremium ? "Plan Premium" : "Plan Free"}
            </p>
          </div>
          <ThemeToggle />
        </div>
        <Button variant="ghost" size="sm" className="mt-1 w-full justify-start text-muted-foreground"
          onClick={() => { logout(); navigate("/login"); }}>
          <LogOut className="h-4 w-4" /> Cerrar sesión
        </Button>
      </div>
    </div>
  );
}

export function AppShell() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-dvh bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-border bg-card lg:flex lg:flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="app-overlay absolute inset-0" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85%] border-r border-border bg-card shadow-xl">
            <button onClick={() => setOpen(false)} aria-label="Cerrar menú"
              className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-secondary">
              <X className="h-5 w-5" />
            </button>
            <SidebarContent onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/90 px-4 py-3 backdrop-blur-md lg:hidden">
        <button onClick={() => setOpen(true)} aria-label="Abrir menú"
          className="grid h-9 w-9 place-items-center rounded-md text-foreground hover:bg-secondary">
          <Menu className="h-5 w-5" />
        </button>
        <Brand />
        <ThemeToggle />
      </header>

      {/* Content */}
      <div className="lg:pl-64">
        <main key={location.pathname} className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
