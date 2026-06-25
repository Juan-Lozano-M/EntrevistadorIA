import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Accent = "default" | "azul" | "purpura" | "verde";

// HSL triplets applied to --primary; "default" keeps the theme's iris.
export const ACCENT_HSL: Record<Exclude<Accent, "default">, string> = {
  azul: "217 91% 60%",
  purpura: "262 83% 67%",
  verde: "158 64% 44%",
};

export const ACCENT_DOT: Record<Accent, string> = {
  default: "hsl(245 64% 58%)",
  azul: "hsl(217 91% 60%)",
  purpura: "hsl(262 83% 67%)",
  verde: "hsl(158 64% 44%)",
};

/** Override --primary so the whole UI re-tints; "default" restores the theme value. */
export function applyAccent(accent: Accent) {
  if (typeof document === "undefined") return;
  const el = document.documentElement;
  if (accent === "default") {
    el.style.removeProperty("--primary");
    el.style.removeProperty("--primary-foreground");
  } else {
    el.style.setProperty("--primary", ACCENT_HSL[accent]);
    el.style.setProperty("--primary-foreground", "0 0% 100%");
  }
}

type SettingsState = {
  // Interview defaults (feed the new-interview wizard).
  language: string;
  level: string;
  type: string;
  professionSlug: string;
  // Appearance.
  accent: Accent;
  setPreferences: (p: Partial<Pick<SettingsState, "language" | "level" | "type" | "professionSlug">>) => void;
  setAccent: (accent: Accent) => void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: "es",
      level: "JUNIOR",
      type: "MIXED",
      professionSlug: "",
      accent: "default",
      setPreferences: (p) => set(p),
      setAccent: (accent) => { applyAccent(accent); set({ accent }); },
    }),
    { name: "interviewai-settings" },
  ),
);
