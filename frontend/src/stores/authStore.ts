import { create } from "zustand";
import { persist } from "zustand/middleware";

type User = { name: string; email: string };
type AuthState = {
  token: string | null;
  user: User | null;
  setAuth: (a: { token: string; name: string; email: string }) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: ({ token, name, email }) => set({ token, user: { name, email } }),
      logout: () => set({ token: null, user: null }),
    }),
    { name: "interviewai-auth" },
  ),
);
