import { useAuthStore } from "@/stores/authStore";

const BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/api";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// ---- DTO types (mirror the backend) ----
export type Plan = "FREE" | "PREMIUM";
export type Modality = "STANDARD" | "CHAT" | "VOICE";
export type AuthResponse = { token: string; name: string; email: string; plan: Plan };
export type NotificationPrefs = { daily: boolean; weekly: boolean; achievements: boolean; product: boolean };
export type SavedCard = { brand: string; last4: string };
export type Account = { name: string; email: string; plan: Plan; notifications: NotificationPrefs; card: SavedCard | null };
export type RegisterRequest = { name: string; email: string; password: string };
export type LoginRequest = { email: string; password: string };
export type Profession = { id: number; slug: string; name: string; description: string };
export type Options = { levels: string[]; types: string[]; dimensions: string[] };
export type CreateInterviewRequest = {
  professionSlug: string; roleTitle: string; targetCompany?: string; industry?: string;
  level: string; type: string; language: string; durationMinutes: number; modality?: Modality;
};
export type SessionSummary = {
  id: number; roleTitle: string; level: string; type: string;
  status: string; overallScore: number | null; startedAt: string; modality: Modality;
};
export type ChatMessage = { role: "user" | "assistant"; content: string };
export type Question = { id: number; text: string; type: string; index: number; total: number };
export type NextQuestion = { question: Question | null; finished: boolean };
export type SubmitAnswerRequest = {
  questionId: number; answerText: string; responseTimeMs: number; selfConfidence: number;
};
export type AnswerReview = {
  questionId: number; questionText: string; answerText: string;
  modelAnswer: string; dimensionScores: Record<string, number>;
};
export type Feedback = {
  strengths: string[]; weaknesses: string[]; recommendations: string[]; improvementPlan: string[];
};
export type Results = {
  sessionId: number; roleTitle: string; level: string; type: string; overallScore: number | null;
  dimensionScores: Record<string, number>; feedback: Feedback; answers: AnswerReview[];
};

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = useAuthStore.getState().token;
  const headers: Record<string, string> = { ...(init.headers as Record<string, string>) };
  if (init.body) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...init, headers });

  if (res.status === 401) {
    if (!path.startsWith("/auth/")) {
      useAuthStore.getState().logout();
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
    }
    throw new ApiError(401, await readMessage(res, "No autenticado"));
  }
  if (!res.ok) throw new ApiError(res.status, await readMessage(res, "Error de servidor"));
  if (res.status === 204 || res.headers.get("content-length") === "0") return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

async function readMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json();
    return (body && typeof body.message === "string") ? body.message : fallback;
  } catch {
    return fallback;
  }
}

const json = (body: unknown): RequestInit => ({ body: JSON.stringify(body) });

export const register = (b: RegisterRequest) => request<AuthResponse>("/auth/register", { method: "POST", ...json(b) });
export const login = (b: LoginRequest) => request<AuthResponse>("/auth/login", { method: "POST", ...json(b) });
export const forgotPassword = (email: string) =>
  request<void>("/auth/forgot-password", { method: "POST", ...json({ email }) });
export const resetPassword = (token: string, newPassword: string) =>
  request<void>("/auth/reset-password", { method: "POST", ...json({ token, newPassword }) });
export const getProfessions = () => request<Profession[]>("/professions");
export const getOptions = () => request<Options>("/professions/options");
export const createInterview = (b: CreateInterviewRequest) => request<SessionSummary>("/interviews", { method: "POST", ...json(b) });
export const getNextQuestion = (id: number) => request<NextQuestion>(`/interviews/${id}/next-question`);
export const submitAnswer = (id: number, b: SubmitAnswerRequest) => request<void>(`/interviews/${id}/answers`, { method: "POST", ...json(b) });
export const finishInterview = (id: number) => request<SessionSummary>(`/interviews/${id}/finish`, { method: "POST" });
export const getResults = (id: number) => request<Results>(`/interviews/${id}/results`);
export const getHistory = () => request<SessionSummary[]>("/interviews");

// ---- stats ----
export type OverviewPoint = { date: string; score: number; dimensionScores: Record<string, number> };
export type Overview = {
  total: number; completed: number; average: number; best: number;
  timeline: OverviewPoint[]; dimensionAverages: Record<string, number>;
};
export const getStatsOverview = () => request<Overview>("/stats/overview");

export type Achievement = {
  key: string; title: string; description: string; category: string; tier: string;
  xpReward: number; progress: number; target: number; unlocked: boolean;
};
export type Gamification = {
  xp: number; level: number; levelName: string; xpInLevel: number; xpForNextLevel: number;
  streakDays: number; bestStreak: number; achievements: Achievement[];
};
export const getGamification = () => request<Gamification>("/stats/gamification");

// ---- account / plan ----
export const getMe = () => request<Account>("/account/me");
export type BillingConfig = { publicKey: string; currency: string; amount: number };
export const getBillingConfig = () => request<BillingConfig>("/billing/config");
export type SubscribeResult = { status: string; paymentId?: string; externalResourceUrl?: string; creq?: string };
export type SubscribePayload = {
  tokenPay: string; tokenSub: string; paymentMethodId: string;
  idType: string; idNumber: string; cardLast4: string; cardBrand: string;
};
export const prepareCard = (cardToken: string) =>
  request<{ cardId: string }>("/billing/prepare-card", { method: "POST", ...json({ cardToken }) });
export const subscribe = (p: SubscribePayload) =>
  request<SubscribeResult>("/billing/subscribe", { method: "POST", ...json(p) });
export const confirmPayment = (p: { paymentId: string; cardToken: string; cardLast4: string; cardBrand: string }) =>
  request<SubscribeResult>("/billing/confirm", { method: "POST", ...json(p) });
export const testPayment = (p: SubscribePayload) =>
  request<{ status: string; statusDetail: string; id: string }>("/billing/test-payment", { method: "POST", ...json(p) });
export const cancelSubscription = () => request<void>("/billing/cancel", { method: "POST" });
export const updateName = (name: string) => request<Account>("/account", { method: "PATCH", ...json({ name }) });
export const changePassword = (currentPassword: string, newPassword: string) =>
  request<void>("/account/password", { method: "POST", ...json({ currentPassword, newPassword }) });
export const deleteAccount = () => request<void>("/account", { method: "DELETE" });
export const updateNotifications = (p: NotificationPrefs) =>
  request<Account>("/account/notifications", { method: "PATCH", ...json(p) });
export const sendTestEmail = () => request<{ sent: boolean }>("/account/notifications/test", { method: "POST" });

// ---- premium AI chat ----
export const getChatHistory = (id: number) => request<ChatMessage[]>(`/interviews/${id}/chat`);
export const startChat = (id: number) =>
  request<ChatMessage[]>(`/interviews/${id}/chat/start`, { method: "POST" });
export const sendChatMessage = (id: number, message: string) =>
  request<{ reply: string; finished: boolean }>(`/interviews/${id}/chat`, { method: "POST", ...json({ message }) });
