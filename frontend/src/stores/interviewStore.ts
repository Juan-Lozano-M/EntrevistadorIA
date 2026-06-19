import { create } from "zustand";

type InterviewState = {
  shownAt: number | null;
  markShown: () => void;
  elapsedMs: () => number;
};

export const useInterviewStore = create<InterviewState>((set, get) => ({
  shownAt: null,
  markShown: () => set({ shownAt: Date.now() }),
  elapsedMs: () => {
    const t = get().shownAt;
    return t == null ? 0 : Date.now() - t;
  },
}));
