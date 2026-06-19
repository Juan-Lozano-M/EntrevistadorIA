# InterviewAI Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the InterviewAI MVP frontend: a React SPA where a user registers/logs in, configures an interview, answers questions with a timer and self-assessment, and views a scored report (overall + 8-dimension radar + feedback), all consuming the existing backend REST API.

**Architecture:** Vite + React + TypeScript SPA. Tailwind + shadcn/ui for a sober, professional look with subtle gamification, dark/light themed via CSS variables. React Query owns server state; Zustand owns client state (auth + active interview). A single typed `lib/api.ts` is the only boundary to the backend. Tests use Vitest + React Testing Library + MSW (no running backend).

**Tech Stack:** React, TypeScript, Vite, **Tailwind CSS v4** (CSS-first config via `@tailwindcss/vite` plugin; `@theme inline` tokens, no `tailwind.config.js`), shadcn-style components built on **Radix** (hand-authored under `components/ui/`, classic `asChild` API), TanStack Query, Zustand, React Router (v7, v6-compatible API), react-hook-form + zod, recharts, sonner, Vitest, React Testing Library, MSW.

> **TAILWIND v4 NOTE (decided during Task 1):** The plan was authored for Tailwind v3 + `tailwind.config.js`, but the project uses **Tailwind v4** (the modern default; the current `shadcn` CLI also defaults to Base UI, which we rejected to keep the Radix `asChild` API the plan relies on). Concrete differences from the task text below: theme tokens live in `src/index.css` via `@import "tailwindcss"`, `@custom-variant dark (&:is(.dark *))`, and an `@theme inline` block mapping `--color-*` to the HSL CSS variables — there is no `tailwind.config.js` or `postcss.config.js`. The shadcn `components/ui/*` files are hand-authored Radix versions (button, card, input, label, textarea, slider, skeleton, sonner). All utility classes used in later tasks (`bg-primary`, `text-muted-foreground`, `rounded-lg`, etc.) resolve identically under this v4 setup, so Tasks 2–8 are unaffected.

## Global Constraints

- Node 18+ (this machine has Node 23, npm 10.9). Package manager: **npm**. Run all commands from `frontend/`.
- **`src/lib/api.ts` is the ONLY module that talks to the backend.** It injects `Authorization: Bearer <token>`, parses JSON, maps backend error bodies `{ "message": string }` to a thrown `ApiError`, and on HTTP 401 clears the auth store and redirects to `/login`.
- Backend base URL from `import.meta.env.VITE_API_BASE_URL`, default `http://localhost:8080/api`.
- Dark/light theme via CSS variables (shadcn convention) + a toggle persisted to `localStorage` under key `interviewai-theme`.
- The 8 dimensions are keyed by the backend's enum names and shown with Spanish labels: COMMUNICATION=Comunicación, CLARITY=Claridad, CONFIDENCE=Seguridad, CRITICAL_THINKING=Pensamiento crítico, PROBLEM_SOLVING=Resolución de problemas, DOMAIN_KNOWLEDGE=Conocimiento del área, LEADERSHIP=Liderazgo, TEAMWORK=Trabajo en equipo.
- Score bands (match backend thresholds): red `< 50`, amber `50–74`, green `>= 75`.
- Feature-based folders (see File Structure). Each page/component file has one responsibility.
- Every task ends green: `npm run test -- --run` passes, and `npm run build` succeeds for tasks that change app wiring.
- All user-facing copy is in Spanish.

## Backend API contract (consumed; do not change the backend)

Base `/api`. Auth endpoints are public; everything else needs `Authorization: Bearer <token>`.

- `POST /auth/register` body `{name,email,password}` → `200 {token,name,email}`; duplicate email → `409 {message}`.
- `POST /auth/login` body `{email,password}` → `200 {token,name,email}`; bad creds → `401 {message}`.
- `GET /professions` → `[{id,slug,name,description}]`.
- `GET /professions/options` → `{levels:string[],types:string[],dimensions:string[]}`.
- `POST /interviews` body `{professionSlug,roleTitle,targetCompany?,industry?,level,type,language,durationMinutes}` → `200 {id,roleTitle,level,type,status,overallScore,startedAt}` (SessionSummary). Invalid level/type → `400 {message}`.
- `GET /interviews/{id}/next-question` → `{question:{id,text,type,index,total}|null, finished:boolean}`.
- `POST /interviews/{id}/answers` body `{questionId,answerText,responseTimeMs,selfConfidence}` → `200` (empty). Duplicate question → `409`.
- `POST /interviews/{id}/finish` → `200` SessionSummary (with `overallScore`, `status:"FINISHED"`).
- `GET /interviews/{id}/results` → `{sessionId,roleTitle,level,type,overallScore,dimensionScores:{DIM:int},feedback:{strengths[],weaknesses[],recommendations[],improvementPlan[]},answers:[{questionId,questionText,answerText,modelAnswer,dimensionScores:{DIM:int}}]}`. Before finish → `409 {message}`.
- `GET /interviews` → `[SessionSummary]` (most recent first).

---

## File Structure

```
frontend/
├── index.html
├── package.json
├── vite.config.ts            (Vite + Vitest config, @ alias, jsdom)
├── tsconfig.json, tsconfig.node.json
├── tailwind.config.js, postcss.config.js
├── components.json           (shadcn config)
├── .env                      (VITE_API_BASE_URL)
└── src/
    ├── main.tsx              (QueryClientProvider + ThemeProvider + RouterProvider)
    ├── App.tsx               (route table)
    ├── index.css             (Tailwind layers + theme CSS variables)
    ├── test/
    │   ├── setup.ts          (RTL + MSW server lifecycle)
    │   ├── server.ts         (MSW server)
    │   └── utils.tsx         (renderWithProviders)
    ├── lib/
    │   ├── api.ts            (typed fetch client + DTO types + ApiError)
    │   ├── dimensions.ts     (DIMENSION_LABELS, scoreBand)
    │   └── queryClient.ts
    ├── stores/
    │   ├── authStore.ts      (zustand persisted)
    │   └── interviewStore.ts (active session/timer)
    ├── theme/ThemeProvider.tsx
    ├── components/
    │   ├── ui/               (shadcn-generated)
    │   ├── Layout.tsx
    │   ├── ProtectedRoute.tsx
    │   ├── ThemeToggle.tsx
    │   ├── ScoreRing.tsx
    │   └── ScoreRadar.tsx
    └── features/
        ├── auth/      LoginPage.tsx, RegisterPage.tsx
        ├── dashboard/ DashboardPage.tsx
        ├── interview/ ConfigWizardPage.tsx, InterviewPage.tsx, ResultsPage.tsx, queries.ts
        └── history/   HistoryPage.tsx
```

---

## Task 1: Scaffold + Tailwind + shadcn + theme + test tooling

**Files:**
- Create the whole `frontend/` project via Vite, then add config files below.
- Create: `frontend/.env`, `frontend/src/index.css`, `frontend/src/theme/ThemeProvider.tsx`, `frontend/src/components/ThemeToggle.tsx`
- Create: `frontend/vite.config.ts` (overwrite), `frontend/src/test/setup.ts`
- Create: `frontend/src/theme/ThemeProvider.test.tsx`

**Interfaces:**
- Produces: `ThemeProvider` (wraps app, applies `.dark` class from localStorage `interviewai-theme`), `useTheme()` returning `{ theme, toggleTheme }`. Vitest configured with jsdom + `src/test/setup.ts`. Path alias `@/` → `src/`.

- [ ] **Step 1: Scaffold the Vite project**

From `c:\Users\Acer\Documents\EntrevistadorIA` run:
```
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
```

- [ ] **Step 2: Install dependencies**

From `frontend/`:
```
npm install react-router-dom @tanstack/react-query zustand react-hook-form zod @hookform/resolvers recharts sonner clsx tailwind-merge lucide-react class-variance-authority
npm install -D tailwindcss@3 postcss autoprefixer vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom msw @types/node
npx tailwindcss init -p
```

- [ ] **Step 3: Configure Tailwind + path alias + Vitest**

Overwrite `frontend/tailwind.config.js`:
```js
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
      },
      borderRadius: { lg: "var(--radius)", md: "calc(var(--radius) - 2px)", sm: "calc(var(--radius) - 4px)" },
    },
  },
  plugins: [],
};
```

Overwrite `frontend/vite.config.ts`:
```ts
/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: true,
  },
});
```

In `frontend/tsconfig.json`, add under `compilerOptions`:
```json
"baseUrl": ".",
"paths": { "@/*": ["./src/*"] }
```

- [ ] **Step 4: Theme CSS variables**

Overwrite `frontend/src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 240 10% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 240 10% 3.9%;
    --primary: 245 58% 51%;
    --primary-foreground: 0 0% 98%;
    --secondary: 240 4.8% 95.9%;
    --secondary-foreground: 240 5.9% 10%;
    --muted: 240 4.8% 95.9%;
    --muted-foreground: 240 3.8% 46.1%;
    --accent: 240 4.8% 95.9%;
    --accent-foreground: 240 5.9% 10%;
    --destructive: 0 72% 51%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 5.9% 90%;
    --input: 240 5.9% 90%;
    --ring: 245 58% 51%;
    --radius: 0.65rem;
  }
  .dark {
    --background: 240 10% 3.9%;
    --foreground: 0 0% 98%;
    --card: 240 10% 5.9%;
    --card-foreground: 0 0% 98%;
    --primary: 245 70% 66%;
    --primary-foreground: 240 10% 3.9%;
    --secondary: 240 3.7% 15.9%;
    --secondary-foreground: 0 0% 98%;
    --muted: 240 3.7% 15.9%;
    --muted-foreground: 240 5% 64.9%;
    --accent: 240 3.7% 15.9%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 62.8% 50%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 3.7% 15.9%;
    --input: 240 3.7% 15.9%;
    --ring: 245 70% 66%;
  }
  * { @apply border-border; }
  body { @apply bg-background text-foreground; }
}
```

- [ ] **Step 5: Initialize shadcn**

```
npx shadcn@latest init -d
```
When prompted by `-d` (defaults) it uses the existing Tailwind config and writes `components.json` + `src/lib/utils.ts` (the `cn()` helper). If it errters on style, accept defaults (New York / Slate / CSS variables). Then add the base components used across the app:
```
npx shadcn@latest add button card input label select textarea slider badge skeleton sonner
```

- [ ] **Step 6: Write the failing theme test**

```tsx
// frontend/src/theme/ThemeProvider.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeProvider, useTheme } from "./ThemeProvider";

function Probe() {
  const { theme, toggleTheme } = useTheme();
  return <button onClick={toggleTheme}>theme:{theme}</button>;
}

describe("ThemeProvider", () => {
  it("defaults to light and toggles to dark, persisting and setting the class", () => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
    render(<ThemeProvider><Probe /></ThemeProvider>);
    expect(screen.getByText("theme:light")).toBeInTheDocument();
    fireEvent.click(screen.getByText("theme:light"));
    expect(screen.getByText("theme:dark")).toBeInTheDocument();
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(localStorage.getItem("interviewai-theme")).toBe("dark");
  });
});
```

- [ ] **Step 7: Create the test setup**

```ts
// frontend/src/test/setup.ts
import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => cleanup());
```

- [ ] **Step 8: Run test to verify it fails**

Run: `npm run test -- --run src/theme/ThemeProvider.test.tsx`
Expected: FAIL (cannot resolve `./ThemeProvider`). (Add the test script in Step 9 first if `npm run test` is undefined — Vite template has none.)

- [ ] **Step 9: Add test script + implement ThemeProvider + ThemeToggle**

In `frontend/package.json` `"scripts"`, add: `"test": "vitest"`.

```tsx
// frontend/src/theme/ThemeProvider.tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "light" | "dark";
type ThemeCtx = { theme: Theme; toggleTheme: () => void };
const Ctx = createContext<ThemeCtx | undefined>(undefined);
const KEY = "interviewai-theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() =>
    (localStorage.getItem(KEY) as Theme) ?? "light");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem(KEY, theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));
  return <Ctx.Provider value={{ theme, toggleTheme }}>{children}</Ctx.Provider>;
}

export function useTheme(): ThemeCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
```

```tsx
// frontend/src/components/ThemeToggle.tsx
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/theme/ThemeProvider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Cambiar tema">
      {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  );
}
```

- [ ] **Step 10: Run test to verify it passes**

Run: `npm run test -- --run src/theme/ThemeProvider.test.tsx`
Expected: PASS.

- [ ] **Step 11: Commit**

```bash
git add frontend
git commit -m "feat(frontend): scaffold Vite+TS, Tailwind, shadcn, theme, test tooling"
```

---

## Task 2: Typed API client + dimensions helpers + auth store

**Files:**
- Create: `frontend/.env`
- Create: `frontend/src/lib/api.ts`, `frontend/src/lib/dimensions.ts`, `frontend/src/lib/queryClient.ts`
- Create: `frontend/src/stores/authStore.ts`
- Create: `frontend/src/test/server.ts`, `frontend/src/test/utils.tsx`
- Create: `frontend/src/lib/api.test.ts`

**Interfaces:**
- Consumes: nothing from prior tasks except the project setup.
- Produces:
  - `authStore` (zustand): state `{ token: string|null, user: {name,email}|null }`, actions `setAuth({token,name,email})`, `logout()`. Persisted to localStorage key `interviewai-auth`. Reads via `useAuthStore`.
  - `lib/api.ts`: `class ApiError extends Error { status: number }`; typed functions: `register(body)`, `login(body)`, `getProfessions()`, `getOptions()`, `createInterview(body)`, `getNextQuestion(id)`, `submitAnswer(id, body)`, `finishInterview(id)`, `getResults(id)`, `getHistory()`. Exported TS types mirror the DTO contract above. A 401 triggers `authStore.getState().logout()` and `window.location.assign("/login")`.
  - `lib/dimensions.ts`: `DIMENSION_LABELS: Record<string,string>` and `scoreBand(score:number): "low"|"mid"|"high"`.
  - `test/server.ts`: an MSW `server`; `test/utils.tsx`: `renderWithProviders(ui)` wrapping with a fresh QueryClient + ThemeProvider + MemoryRouter.

- [ ] **Step 1: Create `.env` and dimensions helper**

```
# frontend/.env
VITE_API_BASE_URL=http://localhost:8080/api
```

```ts
// frontend/src/lib/dimensions.ts
export const DIMENSION_LABELS: Record<string, string> = {
  COMMUNICATION: "Comunicación",
  CLARITY: "Claridad",
  CONFIDENCE: "Seguridad",
  CRITICAL_THINKING: "Pensamiento crítico",
  PROBLEM_SOLVING: "Resolución de problemas",
  DOMAIN_KNOWLEDGE: "Conocimiento del área",
  LEADERSHIP: "Liderazgo",
  TEAMWORK: "Trabajo en equipo",
};

export function scoreBand(score: number): "low" | "mid" | "high" {
  if (score < 50) return "low";
  if (score < 75) return "mid";
  return "high";
}
```

- [ ] **Step 2: Write the auth store**

```ts
// frontend/src/stores/authStore.ts
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
```

- [ ] **Step 3: Write the failing API client test**

```ts
// frontend/src/lib/api.test.ts
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { login, getProfessions, ApiError } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";

const BASE = "http://localhost:8080/api";

describe("api client", () => {
  beforeEach(() => useAuthStore.setState({ token: null, user: null }));

  it("login returns the auth payload", async () => {
    server.use(http.post(`${BASE}/auth/login`, () =>
      HttpResponse.json({ token: "t1", name: "Ana", email: "ana@test.com" })));
    const res = await login({ email: "ana@test.com", password: "secret123" });
    expect(res.token).toBe("t1");
    expect(res.name).toBe("Ana");
  });

  it("maps an error body to ApiError with status", async () => {
    server.use(http.post(`${BASE}/auth/login`, () =>
      HttpResponse.json({ message: "Credenciales inválidas" }, { status: 401 })));
    await expect(login({ email: "x@test.com", password: "bad" }))
      .rejects.toMatchObject({ name: "ApiError", status: 401, message: "Credenciales inválidas" });
  });

  it("attaches the bearer token from the auth store", async () => {
    useAuthStore.setState({ token: "abc", user: { name: "A", email: "a@test.com" } });
    let seen: string | null = null;
    server.use(http.get(`${BASE}/professions`, ({ request }) => {
      seen = request.headers.get("authorization");
      return HttpResponse.json([]);
    }));
    await getProfessions();
    expect(seen).toBe("Bearer abc");
  });
});
```

- [ ] **Step 4: Create the MSW server and test utils**

```ts
// frontend/src/test/server.ts
import { setupServer } from "msw/node";
export const server = setupServer();
```

Append MSW lifecycle to `frontend/src/test/setup.ts` so the existing file becomes:
```ts
import "@testing-library/jest-dom/vitest";
import { afterEach, afterAll, beforeAll } from "vitest";
import { cleanup } from "@testing-library/react";
import { server } from "./server";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => { cleanup(); server.resetHandlers(); });
afterAll(() => server.close());
```

```tsx
// frontend/src/test/utils.tsx
import { type ReactElement } from "react";
import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "@/theme/ThemeProvider";

export function renderWithProviders(ui: ReactElement, { route = "/" } = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
      </ThemeProvider>
    </QueryClientProvider>,
  );
}
```

- [ ] **Step 5: Run test to verify it fails**

Run: `npm run test -- --run src/lib/api.test.ts`
Expected: FAIL (cannot resolve `@/lib/api`).

- [ ] **Step 6: Implement the API client and query client**

```ts
// frontend/src/lib/api.ts
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
```

```ts
// frontend/src/lib/queryClient.ts
import { QueryClient } from "@tanstack/react-query";
export const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
});
```

- [ ] **Step 7: Run test to verify it passes**

Run: `npm run test -- --run src/lib/api.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 8: Commit**

```bash
git add frontend/src frontend/.env
git commit -m "feat(frontend): typed API client, auth store, dimensions helpers, MSW test harness"
```

---

## Task 3: Auth pages + routing shell + ProtectedRoute

**Files:**
- Create: `frontend/src/features/auth/LoginPage.tsx`, `frontend/src/features/auth/RegisterPage.tsx`
- Create: `frontend/src/components/ProtectedRoute.tsx`, `frontend/src/components/Layout.tsx`
- Create: `frontend/src/App.tsx` (overwrite), `frontend/src/main.tsx` (overwrite)
- Create: `frontend/src/features/auth/LoginPage.test.tsx`

**Interfaces:**
- Consumes: `login`, `register`, `ApiError` from `@/lib/api`; `useAuthStore`; shadcn `button/card/input/label`; `sonner` `toast`.
- Produces: routes `/login`, `/register` (public), and a `ProtectedRoute` wrapper that renders `<Outlet/>` inside `Layout` when `useAuthStore` has a token, else `<Navigate to="/login"/>`. `main.tsx` mounts `QueryClientProvider` + `ThemeProvider` + `RouterProvider` + `<Toaster/>`.

- [ ] **Step 1: Write the failing login test**

```tsx
// frontend/src/features/auth/LoginPage.test.tsx
import { http, HttpResponse } from "msw";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { server } from "@/test/server";
import { renderWithProviders } from "@/test/utils";
import { LoginPage } from "./LoginPage";
import { useAuthStore } from "@/stores/authStore";

const BASE = "http://localhost:8080/api";

describe("LoginPage", () => {
  beforeEach(() => useAuthStore.setState({ token: null, user: null }));

  it("logs in and stores the token", async () => {
    server.use(http.post(`${BASE}/auth/login`, () =>
      HttpResponse.json({ token: "tok", name: "Ana", email: "ana@test.com" })));
    renderWithProviders(<LoginPage />, { route: "/login" });

    await userEvent.type(screen.getByLabelText(/email/i), "ana@test.com");
    await userEvent.type(screen.getByLabelText(/contraseña/i), "secret123");
    await userEvent.click(screen.getByRole("button", { name: /iniciar sesión/i }));

    await waitFor(() => expect(useAuthStore.getState().token).toBe("tok"));
  });

  it("shows an error message on invalid credentials", async () => {
    server.use(http.post(`${BASE}/auth/login`, () =>
      HttpResponse.json({ message: "Credenciales inválidas" }, { status: 401 })));
    renderWithProviders(<LoginPage />, { route: "/login" });

    await userEvent.type(screen.getByLabelText(/email/i), "x@test.com");
    await userEvent.type(screen.getByLabelText(/contraseña/i), "bad");
    await userEvent.click(screen.getByRole("button", { name: /iniciar sesión/i }));

    expect(await screen.findByText(/credenciales inválidas/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- --run src/features/auth/LoginPage.test.tsx`
Expected: FAIL (cannot resolve `./LoginPage`).

- [ ] **Step 3: Implement LoginPage**

```tsx
// frontend/src/features/auth/LoginPage.tsx
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { login, ApiError } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Requerido"),
});
type Form = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<Form>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: Form) => {
    setServerError(null);
    try {
      const res = await login(data);
      setAuth(res);
      toast.success(`Bienvenido, ${res.name}`);
      navigate("/");
    } catch (e) {
      setServerError(e instanceof ApiError ? e.message : "Error inesperado");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader><CardTitle>Iniciar sesión</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register("email")} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" {...register("password")} />
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>
            {serverError && <p className="text-sm text-destructive">{serverError}</p>}
            <Button type="submit" className="w-full" disabled={isSubmitting}>Iniciar sesión</Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            ¿No tienes cuenta? <Link to="/register" className="text-primary underline">Regístrate</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- --run src/features/auth/LoginPage.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Implement RegisterPage**

```tsx
// frontend/src/features/auth/RegisterPage.tsx
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { register as registerApi, ApiError } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  name: z.string().min(1, "Requerido"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});
type Form = z.infer<typeof schema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<Form>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: Form) => {
    setServerError(null);
    try {
      const res = await registerApi(data);
      setAuth(res);
      toast.success(`Cuenta creada. ¡Hola, ${res.name}!`);
      navigate("/");
    } catch (e) {
      setServerError(e instanceof ApiError ? e.message : "Error inesperado");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader><CardTitle>Crear cuenta</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-1">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" {...register("name")} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register("email")} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" {...register("password")} />
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>
            {serverError && <p className="text-sm text-destructive">{serverError}</p>}
            <Button type="submit" className="w-full" disabled={isSubmitting}>Crear cuenta</Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            ¿Ya tienes cuenta? <Link to="/login" className="text-primary underline">Inicia sesión</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 6: Implement ProtectedRoute, Layout, App, main**

```tsx
// frontend/src/components/ProtectedRoute.tsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { Layout } from "./Layout";

export function ProtectedRoute() {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <Layout><Outlet /></Layout>;
}
```

```tsx
// frontend/src/components/Layout.tsx
import { type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";

export function Layout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link to="/" className="text-lg font-semibold">InterviewAI</Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {user && <span className="text-sm text-muted-foreground">{user.name}</span>}
            <Button variant="ghost" size="sm" onClick={() => { logout(); navigate("/login"); }}>
              Salir
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
```

```tsx
// frontend/src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "@/features/auth/LoginPage";
import { RegisterPage } from "@/features/auth/RegisterPage";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { ConfigWizardPage } from "@/features/interview/ConfigWizardPage";
import { InterviewPage } from "@/features/interview/InterviewPage";
import { ResultsPage } from "@/features/interview/ResultsPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/new" element={<ConfigWizardPage />} />
        <Route path="/interview/:id" element={<InterviewPage />} />
        <Route path="/results/:id" element={<ResultsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
```

> Note: `DashboardPage`, `ConfigWizardPage`, `InterviewPage`, `ResultsPage` are created in Tasks 4–7. To keep the app compiling after this task, create minimal stubs now (each: `export function X(){ return <div/>; }`) in their target files — Tasks 4–7 replace them. This keeps Task 3 independently green.

```tsx
// frontend/src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { queryClient } from "@/lib/queryClient";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <App />
          <Toaster richColors />
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
```

- [ ] **Step 7: Create stub pages so the build compiles**

Create these four files (replaced in later tasks):
```tsx
// frontend/src/features/dashboard/DashboardPage.tsx
export function DashboardPage() { return <div />; }
```
```tsx
// frontend/src/features/interview/ConfigWizardPage.tsx
export function ConfigWizardPage() { return <div />; }
```
```tsx
// frontend/src/features/interview/InterviewPage.tsx
export function InterviewPage() { return <div />; }
```
```tsx
// frontend/src/features/interview/ResultsPage.tsx
export function ResultsPage() { return <div />; }
```

- [ ] **Step 8: Run tests + build**

Run: `npm run test -- --run` (all tests pass) then `npm run build` (compiles).
Expected: tests PASS; build succeeds.

- [ ] **Step 9: Commit**

```bash
git add frontend/src
git commit -m "feat(frontend): auth pages, protected routing shell, app wiring"
```

---

## Task 4: Dashboard + history

**Files:**
- Create: `frontend/src/features/interview/queries.ts`
- Modify: `frontend/src/features/dashboard/DashboardPage.tsx` (replace stub)
- Create: `frontend/src/features/history/HistoryPage.tsx` and route for it in `App.tsx`
- Create: `frontend/src/features/dashboard/DashboardPage.test.tsx`

**Interfaces:**
- Consumes: `getHistory`, `SessionSummary` from `@/lib/api`; `scoreBand` from `@/lib/dimensions`.
- Produces: `queries.ts` exporting `useHistory()` = `useQuery({ queryKey: ["history"], queryFn: getHistory })`. DashboardPage lists sessions and has a CTA to `/new`; empty state when none.

- [ ] **Step 1: Write the failing dashboard test**

```tsx
// frontend/src/features/dashboard/DashboardPage.test.tsx
import { http, HttpResponse } from "msw";
import { screen } from "@testing-library/react";
import { server } from "@/test/server";
import { renderWithProviders } from "@/test/utils";
import { DashboardPage } from "./DashboardPage";
import { useAuthStore } from "@/stores/authStore";

const BASE = "http://localhost:8080/api";

describe("DashboardPage", () => {
  beforeEach(() => useAuthStore.setState({ token: "t", user: { name: "Ana", email: "a@test.com" } }));

  it("renders the user's interview history", async () => {
    server.use(http.get(`${BASE}/interviews`, () => HttpResponse.json([
      { id: 1, roleTitle: "Backend Dev", level: "JUNIOR", type: "MIXED", status: "FINISHED", overallScore: 82, startedAt: "2026-06-18T10:00:00Z" },
    ])));
    renderWithProviders(<DashboardPage />);
    expect(await screen.findByText("Backend Dev")).toBeInTheDocument();
    expect(screen.getByText(/82/)).toBeInTheDocument();
  });

  it("shows an empty state with a CTA when there is no history", async () => {
    server.use(http.get(`${BASE}/interviews`, () => HttpResponse.json([])));
    renderWithProviders(<DashboardPage />);
    expect(await screen.findByText(/aún no tienes entrevistas/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /nueva entrevista/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- --run src/features/dashboard/DashboardPage.test.tsx`
Expected: FAIL (stub renders empty div).

- [ ] **Step 3: Implement queries.ts and DashboardPage**

```ts
// frontend/src/features/interview/queries.ts
import { useQuery } from "@tanstack/react-query";
import { getHistory, getResults } from "@/lib/api";

export const useHistory = () =>
  useQuery({ queryKey: ["history"], queryFn: getHistory });

export const useResults = (id: number) =>
  useQuery({ queryKey: ["results", id], queryFn: () => getResults(id) });
```

```tsx
// frontend/src/features/dashboard/DashboardPage.tsx
import { Link } from "react-router-dom";
import { useHistory } from "@/features/interview/queries";
import { scoreBand } from "@/lib/dimensions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/stores/authStore";

const bandClass: Record<string, string> = {
  low: "text-destructive",
  mid: "text-amber-500",
  high: "text-green-600 dark:text-green-400",
};

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data: sessions, isLoading } = useHistory();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Hola, {user?.name ?? ""}</h1>
          <p className="text-muted-foreground">Practica y mejora tus entrevistas.</p>
        </div>
        <Button asChild><Link to="/new">Nueva entrevista</Link></Button>
      </div>

      {isLoading && <div className="grid gap-3 sm:grid-cols-2"><Skeleton className="h-24" /><Skeleton className="h-24" /></div>}

      {!isLoading && sessions && sessions.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-muted-foreground">Aún no tienes entrevistas. ¡Empieza la primera!</p>
            <Button asChild><Link to="/new">Nueva entrevista</Link></Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && sessions && sessions.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {sessions.map((s) => (
            <Link key={s.id} to={s.status === "FINISHED" ? `/results/${s.id}` : `/interview/${s.id}`}>
              <Card className="transition-colors hover:border-primary">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{s.roleTitle}</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{s.level} · {s.type}</span>
                  {s.overallScore != null
                    ? <span className={`text-xl font-bold ${bandClass[scoreBand(s.overallScore)]}`}>{s.overallScore}</span>
                    : <span className="text-sm text-muted-foreground">En progreso</span>}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
```

`HistoryPage` for the MVP is the same data; the dashboard already lists it. Create a thin alias page and route so `/history` exists:
```tsx
// frontend/src/features/history/HistoryPage.tsx
import { DashboardPage } from "@/features/dashboard/DashboardPage";
export function HistoryPage() { return <DashboardPage />; }
```
Add to `App.tsx` inside the protected routes: `<Route path="/history" element={<HistoryPage />} />` and import it.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- --run src/features/dashboard/DashboardPage.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add frontend/src
git commit -m "feat(frontend): dashboard with interview history and empty state"
```

---

## Task 5: Config wizard

**Files:**
- Modify: `frontend/src/features/interview/ConfigWizardPage.tsx` (replace stub)
- Create: `frontend/src/features/interview/ConfigWizardPage.test.tsx`

**Interfaces:**
- Consumes: `getProfessions`, `getOptions`, `createInterview`, types from `@/lib/api`; shadcn `select`, `input`, `button`, `card`, `label`.
- Produces: a form that loads professions + options, validates required fields (profession, role, level, type, language, duration), calls `createInterview`, and on success navigates to `/interview/{id}`.

- [ ] **Step 1: Write the failing wizard test**

```tsx
// frontend/src/features/interview/ConfigWizardPage.test.tsx
import { http, HttpResponse } from "msw";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { server } from "@/test/server";
import { renderWithProviders } from "@/test/utils";
import { ConfigWizardPage } from "./ConfigWizardPage";
import { useAuthStore } from "@/stores/authStore";

const BASE = "http://localhost:8080/api";

function mockMeta() {
  server.use(
    http.get(`${BASE}/professions`, () => HttpResponse.json([
      { id: 1, slug: "software-development", name: "Desarrollo de Software", description: "" },
    ])),
    http.get(`${BASE}/professions/options`, () => HttpResponse.json({
      levels: ["JUNIOR", "SENIOR"], types: ["TECHNICAL", "MIXED"], dimensions: [],
    })),
  );
}

describe("ConfigWizardPage", () => {
  beforeEach(() => useAuthStore.setState({ token: "t", user: { name: "A", email: "a@test.com" } }));

  it("loads professions and options", async () => {
    mockMeta();
    renderWithProviders(<ConfigWizardPage />);
    expect(await screen.findByText("Desarrollo de Software")).toBeInTheDocument();
  });

  it("submits and creates an interview", async () => {
    mockMeta();
    let created: any = null;
    server.use(http.post(`${BASE}/interviews`, async ({ request }) => {
      created = await request.json();
      return HttpResponse.json({ id: 7, roleTitle: created.roleTitle, level: created.level, type: created.type, status: "IN_PROGRESS", overallScore: null, startedAt: "x" });
    }));
    renderWithProviders(<ConfigWizardPage />);
    await screen.findByText("Desarrollo de Software");

    await userEvent.type(screen.getByLabelText(/cargo/i), "Backend Dev");
    await userEvent.click(screen.getByRole("button", { name: /comenzar entrevista/i }));

    await waitFor(() => expect(created).toMatchObject({ professionSlug: "software-development", roleTitle: "Backend Dev" }));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- --run src/features/interview/ConfigWizardPage.test.tsx`
Expected: FAIL (stub).

- [ ] **Step 3: Implement ConfigWizardPage**

```tsx
// frontend/src/features/interview/ConfigWizardPage.tsx
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getProfessions, getOptions, createInterview, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const LEVEL_LABELS: Record<string, string> = {
  INTERN: "Practicante", JUNIOR: "Junior", SEMI_SENIOR: "Semi Senior",
  SENIOR: "Senior", LEAD: "Líder", MANAGER: "Gerente",
};
const TYPE_LABELS: Record<string, string> = {
  TECHNICAL: "Técnica", HR: "Recursos Humanos", SITUATIONAL: "Situacional",
  COMPETENCY: "Competencias", LEADERSHIP: "Liderazgo", MIXED: "Mixta",
};

export function ConfigWizardPage() {
  const navigate = useNavigate();
  const professions = useQuery({ queryKey: ["professions"], queryFn: getProfessions });
  const options = useQuery({ queryKey: ["options"], queryFn: getOptions });

  const [form, setForm] = useState({
    professionSlug: "", roleTitle: "", targetCompany: "", industry: "",
    level: "", type: "", language: "es", durationMinutes: 15,
  });
  const [error, setError] = useState<string | null>(null);

  // Default selects to the first option once data arrives.
  if (professions.data && !form.professionSlug && professions.data.length > 0) {
    setForm((f) => ({ ...f, professionSlug: professions.data![0].slug }));
  }
  if (options.data && !form.level && options.data.levels.length > 0) {
    setForm((f) => ({ ...f, level: options.data!.levels[0], type: options.data!.types[0] }));
  }

  const mutation = useMutation({
    mutationFn: createInterview,
    onSuccess: (s) => { toast.success("Entrevista creada"); navigate(`/interview/${s.id}`); },
    onError: (e) => setError(e instanceof ApiError ? e.message : "Error inesperado"),
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.roleTitle.trim()) { setError("El cargo es obligatorio"); return; }
    mutation.mutate(form);
  };

  if (professions.isLoading || options.isLoading) return <p>Cargando…</p>;

  return (
    <Card className="mx-auto max-w-xl">
      <CardHeader><CardTitle>Configura tu entrevista</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="profession">Profesión</Label>
            <select id="profession" className="w-full rounded-md border bg-background p-2"
              value={form.professionSlug}
              onChange={(e) => setForm({ ...form, professionSlug: e.target.value })}>
              {professions.data!.map((p) => <option key={p.slug} value={p.slug}>{p.name}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="role">Cargo</Label>
            <Input id="role" value={form.roleTitle}
              onChange={(e) => setForm({ ...form, roleTitle: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="company">Empresa (opcional)</Label>
              <Input id="company" value={form.targetCompany}
                onChange={(e) => setForm({ ...form, targetCompany: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="industry">Industria (opcional)</Label>
              <Input id="industry" value={form.industry}
                onChange={(e) => setForm({ ...form, industry: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="level">Nivel</Label>
              <select id="level" className="w-full rounded-md border bg-background p-2"
                value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
                {options.data!.levels.map((l) => <option key={l} value={l}>{LEVEL_LABELS[l] ?? l}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="type">Tipo</Label>
              <select id="type" className="w-full rounded-md border bg-background p-2"
                value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {options.data!.types.map((t) => <option key={t} value={t}>{TYPE_LABELS[t] ?? t}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="language">Idioma</Label>
              <select id="language" className="w-full rounded-md border bg-background p-2"
                value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })}>
                <option value="es">Español</option>
                <option value="en">Inglés</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="duration">Duración (min)</Label>
              <Input id="duration" type="number" min={5} max={120} value={form.durationMinutes}
                onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })} />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            Comenzar entrevista
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- --run src/features/interview/ConfigWizardPage.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add frontend/src
git commit -m "feat(frontend): interview configuration wizard"
```

---

## Task 6: Interview screen (chat + timer + submit)

**Files:**
- Create: `frontend/src/stores/interviewStore.ts`
- Modify: `frontend/src/features/interview/InterviewPage.tsx` (replace stub)
- Create: `frontend/src/features/interview/InterviewPage.test.tsx`

**Interfaces:**
- Consumes: `getNextQuestion`, `submitAnswer`, `finishInterview` from `@/lib/api`; shadcn `textarea`, `slider`, `button`, `card`.
- Produces: `interviewStore` (zustand) `{ shownAt: number|null, markShown(): void, elapsedMs(): number }` for response timing. InterviewPage fetches the next question, lets the user type an answer + set confidence (1–5), submits with `responseTimeMs`, refetches; when `finished`, calls `finishInterview` and navigates to `/results/{id}`.

- [ ] **Step 1: Write the failing interview test**

```tsx
// frontend/src/features/interview/InterviewPage.test.tsx
import { http, HttpResponse } from "msw";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Routes, Route } from "react-router-dom";
import { server } from "@/test/server";
import { renderWithProviders } from "@/test/utils";
import { InterviewPage } from "./InterviewPage";
import { useAuthStore } from "@/stores/authStore";

const BASE = "http://localhost:8080/api";

describe("InterviewPage", () => {
  beforeEach(() => useAuthStore.setState({ token: "t", user: { name: "A", email: "a@test.com" } }));

  it("shows a question, submits an answer, then finishes and navigates to results", async () => {
    let answered = false;
    server.use(
      http.get(`${BASE}/interviews/7/next-question`, () =>
        answered
          ? HttpResponse.json({ question: null, finished: true })
          : HttpResponse.json({ question: { id: 11, text: "¿Qué es REST?", type: "TECHNICAL", index: 1, total: 1 }, finished: false })),
      http.post(`${BASE}/interviews/7/answers`, async () => { answered = true; return new HttpResponse(null, { status: 200 }); }),
      http.post(`${BASE}/interviews/7/finish`, () =>
        HttpResponse.json({ id: 7, roleTitle: "R", level: "JUNIOR", type: "MIXED", status: "FINISHED", overallScore: 70, startedAt: "x" })),
    );

    renderWithProviders(
      <Routes>
        <Route path="/interview/:id" element={<InterviewPage />} />
        <Route path="/results/:id" element={<div>RESULTS PAGE 7</div>} />
      </Routes>,
      { route: "/interview/7" },
    );

    expect(await screen.findByText("¿Qué es REST?")).toBeInTheDocument();
    await userEvent.type(screen.getByRole("textbox"), "Es un estilo de arquitectura HTTP stateless.");
    await userEvent.click(screen.getByRole("button", { name: /enviar/i }));

    expect(await screen.findByText("RESULTS PAGE 7")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- --run src/features/interview/InterviewPage.test.tsx`
Expected: FAIL (stub).

- [ ] **Step 3: Implement interviewStore**

```ts
// frontend/src/stores/interviewStore.ts
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
```

- [ ] **Step 4: Implement InterviewPage**

```tsx
// frontend/src/features/interview/InterviewPage.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getNextQuestion, submitAnswer, finishInterview, ApiError } from "@/lib/api";
import { useInterviewStore } from "@/stores/interviewStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

export function InterviewPage() {
  const { id } = useParams();
  const sessionId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { markShown, elapsedMs } = useInterviewStore();

  const [answer, setAnswer] = useState("");
  const [confidence, setConfidence] = useState(3);

  const next = useQuery({
    queryKey: ["next-question", sessionId],
    queryFn: () => getNextQuestion(sessionId),
  });

  // Start the timer whenever a new question is shown.
  useEffect(() => {
    if (next.data?.question) markShown();
  }, [next.data?.question?.id, markShown, next.data?.question]);

  const finish = useMutation({
    mutationFn: () => finishInterview(sessionId),
    onSuccess: () => navigate(`/results/${sessionId}`),
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Error al finalizar"),
  });

  const submit = useMutation({
    mutationFn: () =>
      submitAnswer(sessionId, {
        questionId: next.data!.question!.id,
        answerText: answer,
        responseTimeMs: elapsedMs(),
        selfConfidence: confidence,
      }),
    onSuccess: async () => {
      setAnswer("");
      setConfidence(3);
      const refreshed = await queryClient.fetchQuery({
        queryKey: ["next-question", sessionId],
        queryFn: () => getNextQuestion(sessionId),
      });
      if (refreshed.finished) finish.mutate();
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Error al enviar"),
  });

  if (next.isLoading) return <p>Cargando pregunta…</p>;
  if (next.data?.finished) {
    return (
      <div className="space-y-4 text-center">
        <p>Has respondido todas las preguntas.</p>
        <Button onClick={() => finish.mutate()} disabled={finish.isPending}>Ver resultados</Button>
      </div>
    );
  }

  const q = next.data!.question!;
  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <p className="text-sm text-muted-foreground">Pregunta {q.index} de {q.total}</p>
        <CardTitle className="text-lg">{q.text}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea rows={6} value={answer} placeholder="Escribe tu respuesta…"
          onChange={(e) => setAnswer(e.target.value)} />
        <div className="space-y-2">
          <Label>¿Qué tan seguro te sentiste? ({confidence}/5)</Label>
          <Slider min={1} max={5} step={1} value={[confidence]}
            onValueChange={(v) => setConfidence(v[0])} />
        </div>
        <Button className="w-full" disabled={!answer.trim() || submit.isPending}
          onClick={() => submit.mutate()}>
          Enviar respuesta
        </Button>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test -- --run src/features/interview/InterviewPage.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add frontend/src
git commit -m "feat(frontend): interview screen with timed answers and self-assessment"
```

---

## Task 7: Results + ScoreRadar + feedback

**Files:**
- Create: `frontend/src/components/ScoreRadar.tsx`
- Modify: `frontend/src/features/interview/ResultsPage.tsx` (replace stub)
- Create: `frontend/src/features/interview/ResultsPage.test.tsx`

**Interfaces:**
- Consumes: `useResults` from `@/features/interview/queries`; `DIMENSION_LABELS`, `scoreBand` from `@/lib/dimensions`; `recharts`.
- Produces: `ScoreRadar({ scores }: { scores: Record<string,number> })` rendering a recharts RadarChart with Spanish dimension labels. ResultsPage shows overall score, the radar, feedback lists, and per-answer model-answer comparison.

- [ ] **Step 1: Write the failing results test**

```tsx
// frontend/src/features/interview/ResultsPage.test.tsx
import { http, HttpResponse } from "msw";
import { screen } from "@testing-library/react";
import { Routes, Route } from "react-router-dom";
import { server } from "@/test/server";
import { renderWithProviders } from "@/test/utils";
import { ResultsPage } from "./ResultsPage";
import { useAuthStore } from "@/stores/authStore";

const BASE = "http://localhost:8080/api";

describe("ResultsPage", () => {
  beforeEach(() => useAuthStore.setState({ token: "t", user: { name: "A", email: "a@test.com" } }));

  it("renders overall score, feedback and model-answer comparison", async () => {
    server.use(http.get(`${BASE}/interviews/7/results`, () => HttpResponse.json({
      sessionId: 7, roleTitle: "Backend Dev", level: "JUNIOR", type: "MIXED", overallScore: 78,
      dimensionScores: { COMMUNICATION: 80, DOMAIN_KNOWLEDGE: 76 },
      feedback: { strengths: ["Comunicación: buen nivel"], weaknesses: [], recommendations: [], improvementPlan: [] },
      answers: [{ questionId: 11, questionText: "¿Qué es REST?", answerText: "Mi respuesta", modelAnswer: "Respuesta modelo", dimensionScores: { DOMAIN_KNOWLEDGE: 76 } }],
    })));

    renderWithProviders(
      <Routes><Route path="/results/:id" element={<ResultsPage />} /></Routes>,
      { route: "/results/7" },
    );

    expect(await screen.findByText("78")).toBeInTheDocument();
    expect(screen.getByText(/comunicación: buen nivel/i)).toBeInTheDocument();
    expect(screen.getByText("Respuesta modelo")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- --run src/features/interview/ResultsPage.test.tsx`
Expected: FAIL (stub).

- [ ] **Step 3: Implement ScoreRadar**

```tsx
// frontend/src/components/ScoreRadar.tsx
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import { DIMENSION_LABELS } from "@/lib/dimensions";

export function ScoreRadar({ scores }: { scores: Record<string, number> }) {
  const data = Object.entries(scores).map(([dim, value]) => ({
    dimension: DIMENSION_LABELS[dim] ?? dim,
    value,
  }));
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="70%">
          <PolarGrid />
          <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11 }} />
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
          <Radar dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.4} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **Step 4: Implement ResultsPage**

```tsx
// frontend/src/features/interview/ResultsPage.tsx
import { useParams, Link } from "react-router-dom";
import { useResults } from "@/features/interview/queries";
import { ScoreRadar } from "@/components/ScoreRadar";
import { scoreBand } from "@/lib/dimensions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const bandClass: Record<string, string> = {
  low: "text-destructive", mid: "text-amber-500", high: "text-green-600 dark:text-green-400",
};

function FeedbackList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <h3 className="mb-2 font-medium">{title}</h3>
      <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
        {items.map((it, i) => <li key={i}>{it}</li>)}
      </ul>
    </div>
  );
}

export function ResultsPage() {
  const { id } = useParams();
  const { data, isLoading } = useResults(Number(id));

  if (isLoading || !data) return <Skeleton className="h-96" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{data.roleTitle}</h1>
          <p className="text-muted-foreground">{data.level} · {data.type}</p>
        </div>
        <Button asChild variant="outline"><Link to="/">Volver</Link></Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Puntaje global</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-center py-8">
            <span className={`text-6xl font-bold ${bandClass[scoreBand(data.overallScore ?? 0)]}`}>
              {data.overallScore ?? 0}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Dimensiones</CardTitle></CardHeader>
          <CardContent><ScoreRadar scores={data.dimensionScores} /></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Feedback</CardTitle></CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          <FeedbackList title="Fortalezas" items={data.feedback.strengths} />
          <FeedbackList title="Debilidades" items={data.feedback.weaknesses} />
          <FeedbackList title="Recomendaciones" items={data.feedback.recommendations} />
          <FeedbackList title="Plan de mejora" items={data.feedback.improvementPlan} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Tus respuestas vs. respuesta modelo</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {data.answers.map((a) => (
            <div key={a.questionId} className="rounded-lg border p-4">
              <p className="font-medium">{a.questionText}</p>
              <p className="mt-2 text-sm"><span className="text-muted-foreground">Tu respuesta: </span>{a.answerText}</p>
              <p className="mt-1 text-sm"><span className="text-muted-foreground">Respuesta modelo: </span>{a.modelAnswer}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test -- --run src/features/interview/ResultsPage.test.tsx`
Expected: PASS.

- [ ] **Step 6: Run the whole suite + build**

Run: `npm run test -- --run` then `npm run build`.
Expected: all tests PASS; build succeeds.

- [ ] **Step 7: Commit**

```bash
git add frontend/src
git commit -m "feat(frontend): results page with score radar, feedback and model-answer comparison"
```

---

## Task 8: Polish — gamification + loading/empty states

**Files:**
- Create: `frontend/src/components/ScoreRing.tsx`
- Modify: `frontend/src/features/dashboard/DashboardPage.tsx` (add stats header)
- Create: `frontend/src/components/ScoreRing.test.tsx`

**Interfaces:**
- Consumes: `scoreBand` from `@/lib/dimensions`.
- Produces: `ScoreRing({ value, label }: { value: number; label: string })` — an SVG ring showing a 0–100 value with band color; used on the dashboard for the average score and a practice streak count.

- [ ] **Step 1: Write the failing ScoreRing test**

```tsx
// frontend/src/components/ScoreRing.test.tsx
import { render, screen } from "@testing-library/react";
import { ScoreRing } from "./ScoreRing";

describe("ScoreRing", () => {
  it("renders the value and label", () => {
    render(<ScoreRing value={82} label="Promedio" />);
    expect(screen.getByText("82")).toBeInTheDocument();
    expect(screen.getByText("Promedio")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- --run src/components/ScoreRing.test.tsx`
Expected: FAIL (cannot resolve `./ScoreRing`).

- [ ] **Step 3: Implement ScoreRing**

```tsx
// frontend/src/components/ScoreRing.tsx
import { scoreBand } from "@/lib/dimensions";

const bandStroke: Record<string, string> = {
  low: "stroke-destructive", mid: "stroke-amber-500", high: "stroke-green-500",
};

export function ScoreRing({ value, label }: { value: number; label: string }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  const offset = circumference * (1 - clamped / 100);
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
        <circle cx="48" cy="48" r={radius} className="fill-none stroke-muted" strokeWidth="8" />
        <circle cx="48" cy="48" r={radius}
          className={`fill-none ${bandStroke[scoreBand(value)]}`} strokeWidth="8"
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <span className="-mt-14 text-2xl font-bold">{value}</span>
      <span className="mt-8 text-sm text-muted-foreground">{label}</span>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- --run src/components/ScoreRing.test.tsx`
Expected: PASS.

- [ ] **Step 5: Add a stats header to the dashboard**

In `DashboardPage.tsx`, compute simple gamification stats from `sessions` and render them above the history grid when there is at least one finished session. Add this block (and the import `import { ScoreRing } from "@/components/ScoreRing";`) right after the heading `div` and before the loading skeleton:

```tsx
{sessions && sessions.length > 0 && (() => {
  const finished = sessions.filter((s) => s.overallScore != null);
  const avg = finished.length
    ? Math.round(finished.reduce((sum, s) => sum + (s.overallScore ?? 0), 0) / finished.length)
    : 0;
  return (
    <Card>
      <CardContent className="flex items-center justify-around py-6">
        <ScoreRing value={avg} label="Promedio" />
        <div className="flex flex-col items-center gap-1">
          <span className="text-3xl font-bold text-primary">{sessions.length}</span>
          <span className="text-sm text-muted-foreground">Entrevistas</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-3xl font-bold text-primary">{finished.length}</span>
          <span className="text-sm text-muted-foreground">Completadas</span>
        </div>
      </CardContent>
    </Card>
  );
})()}
```

- [ ] **Step 6: Run the whole suite + build**

Run: `npm run test -- --run` then `npm run build`.
Expected: all tests PASS; build succeeds.

- [ ] **Step 7: Commit**

```bash
git add frontend/src
git commit -m "feat(frontend): dashboard gamification stats (score ring, counts)"
```

---

## Manual verification (after Task 8)

1. Start Postgres + backend (`backend/`, `.\mvnw.cmd spring-boot:run`) with a local Postgres, or point `VITE_API_BASE_URL` at a running backend.
2. From `frontend/`: `npm run dev`, open the printed URL.
3. Register → dashboard → "Nueva entrevista" → configure → answer the questions → finish → view results (score, radar, feedback, model answers) → return to dashboard and reopen from history. Toggle dark/light.

---

## Self-Review notes

- **Spec coverage:** landing/login/register (Task 3 — note: the public root redirects to dashboard/login; a marketing landing is out of MVP scope per spec §7, login/register cover the public surface), dashboard + history (Task 4), config wizard with professions/options (Task 5), interview chat + timer + self-confidence + response-time measurement (Task 6, `interviewStore`), results + 8-dimension radar + feedback + model-answer comparison (Task 7), gamification + loading/empty states (Tasks 4/7/8), theme dark/light (Task 1), typed API client as sole backend boundary + 401 handling (Task 2), Vitest+MSW incl. end-to-end interview flow (Task 6 test). Score bands match backend thresholds (`dimensions.ts`).
- **Placeholder scan:** stub pages in Task 3 are explicitly replaced in Tasks 4–7; no other placeholders.
- **Type consistency:** API function names/types in Task 2 (`getNextQuestion`, `submitAnswer`, `finishInterview`, `getResults`, `Results`, `SessionSummary`, `NextQuestion`) are used unchanged in Tasks 4/6/7. `useHistory`/`useResults` defined in Task 4 `queries.ts`, consumed in Tasks 4/7.
- **Deviation noted:** spec mentions a minimal marketing landing; the plan keeps the public surface to login/register and redirects `/` to the dashboard (or `/login` when unauthenticated). This is within MVP scope and avoids building marketing copy now; a landing can be added later without rework.
