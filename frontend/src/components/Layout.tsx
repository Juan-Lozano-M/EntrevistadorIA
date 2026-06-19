import { type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { Brand } from "./Brand";

export function Layout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const initial = user?.name?.trim()?.[0]?.toUpperCase() ?? "?";

  return (
    <div className="app-backdrop min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" aria-label="Ir al inicio">
            <Brand />
          </Link>
          <div className="flex items-center gap-1.5 sm:gap-3">
            <ThemeToggle />
            {user && (
              <span className="hidden items-center gap-2 rounded-full border border-border bg-card py-1 pl-1 pr-3 text-sm sm:inline-flex">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  {initial}
                </span>
                <span className="font-medium">{user.name}</span>
              </span>
            )}
            <Button variant="ghost" size="sm" onClick={() => { logout(); navigate("/login"); }}>
              <LogOut className="h-4 w-4" /> Salir
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:py-10">{children}</main>
    </div>
  );
}
