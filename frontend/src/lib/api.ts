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
export type AuthResponse = { token: string; name: string; email: string };
export type RegisterRequest = { name: string; email: string; password: string };
export type LoginRequest = { email: string; password: string };
export type Profession = { id: number; slug: string; name: string; description: string };
export type Options = { levels: string[]; types: string[]; dimensions: string[] };
export type CreateInterviewRequest = {
  professionSlug: string; roleTitle: string; targetCompany?: string; industry?: string;
  level: string; type: string; language: string; durationMinutes: number;
};
export type SessionSummary = {
  id: number; roleTitle: string; level: string; type: string;
  status: string; overallScore: number | null; startedAt: string;
};
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
    useAuthStore.getState().logout();
    if (typeof window !== "undefined" && window.location.pathname !== "/login") {
      window.location.assign("/login");
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
export const getProfessions = () => request<Profession[]>("/professions");
export const getOptions = () => request<Options>("/professions/options");
export const createInterview = (b: CreateInterviewRequest) => request<SessionSummary>("/interviews", { method: "POST", ...json(b) });
export const getNextQuestion = (id: number) => request<NextQuestion>(`/interviews/${id}/next-question`);
export const submitAnswer = (id: number, b: SubmitAnswerRequest) => request<void>(`/interviews/${id}/answers`, { method: "POST", ...json(b) });
export const finishInterview = (id: number) => request<SessionSummary>(`/interviews/${id}/finish`, { method: "POST" });
export const getResults = (id: number) => request<Results>(`/interviews/${id}/results`);
export const getHistory = () => request<SessionSummary[]>("/interviews");
