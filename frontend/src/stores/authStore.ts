import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Plan } from "@/lib/api";

type User = { name: string; email: string; plan: Plan };
type AuthState = {
  token: string | null;
  user: User | null;
  setAuth: (a: { token: string; name: string; email: string; plan: Plan }, remember?: boolean) => void;
  setPlan: (plan: Plan) => void;
  setName: (name: string) => void;
  logout: () => void;
};

const REMEMBER_KEY = "interviewai-remember";

// "Mantener sesión iniciada": when on, the session persists across browser restarts
// (localStorage); when off, it lives only for the tab session (sessionStorage).
const hybridStorage = {
  getItem: (name: string) => localStorage.getItem(name) ?? sessionStorage.getItem(name),
  setItem: (name: string, value: string) => {
    const remember = localStorage.getItem(REMEMBER_KEY) !== "false";
    if (remember) { localStorage.setItem(name, value); sessionStorage.removeItem(name); }
    else { sessionStorage.setItem(name, value); localStorage.removeItem(name); }
  },
  removeItem: (name: string) => { localStorage.removeItem(name); sessionStorage.removeItem(name); },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: ({ token, name, email, plan }, remember = true) => {
        localStorage.setItem(REMEMBER_KEY, String(remember));
        set({ token, user: { name, email, plan } });
      },
      setPlan: (plan) => set((s) => (s.user ? { user: { ...s.user, plan } } : {})),
      setName: (name) => set((s) => (s.user ? { user: { ...s.user, name } } : {})),
      logout: () => set({ token: null, user: null }),
    }),
    { name: "interviewai-auth", storage: createJSONStorage(() => hybridStorage) },
  ),
);
