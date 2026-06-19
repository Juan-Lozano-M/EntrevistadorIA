# InterviewAI — Diseño del Frontend MVP

**Fecha:** 2026-06-18
**Estado:** Aprobado para implementación
**Depende de:** Backend MVP (ya implementado y en `main`). Consume su API REST.

---

## Contexto

El backend MVP está completo: auth JWT, configuración de entrevista data-driven, motor de
scoring por reglas y feedback, sembrado con la profesión "Desarrollo de Software". Este spec
cubre el **frontend MVP**, que consume esa API. Es la Fase "frontend" del roadmap por fases
de InterviewAI.

### Decisiones tomadas en brainstorming

1. **shadcn/ui** (Radix + Tailwind) — componentes accesibles copiados al proyecto, personalizables.
2. **Personalidad visual:** base sobria y profesional (Linear/Stripe) + **gamificación sutil**.
3. Stack fijado: React + TypeScript + Vite + Tailwind + React Query + Zustand (del spec del MVP).

---

## 1. Alcance (refleja la API del backend)

Endpoints del backend que el frontend consume (todos bajo `/api`, JWT salvo auth):
`POST /auth/register`, `POST /auth/login`, `GET /professions`, `GET /professions/options`,
`POST /interviews`, `GET /interviews/{id}/next-question`, `POST /interviews/{id}/answers`,
`POST /interviews/{id}/finish`, `GET /interviews/{id}/results`, `GET /interviews`.

Pantallas:

- **Público:** landing mínima con propuesta de valor + CTAs a login/registro; páginas de **login** y **registro**.
- **App (protegida):**
  - **Dashboard** — saludo personalizado, CTA "Nueva entrevista", lista de historial reciente,
    stat de progreso y gamificación sutil (ring de progreso, racha, badges de logros).
  - **Wizard de configuración** — profesión (de `GET /professions`), cargo, empresa objetivo,
    industria, nivel, tipo, idioma, duración; niveles/tipos de `GET /professions/options`.
    Validación de campos; al enviar crea la sesión (`POST /interviews`).
  - **Entrevista** — layout tipo chat: una pregunta a la vez (`GET next-question`), temporizador
    visible, caja de respuesta, slider de autoconfianza (1–5); al enviar (`POST answers`) avanza;
    al completarse, `POST finish` y navega a resultados.
  - **Resultados** — puntaje global (reveal animado), radar de las 8 dimensiones, listas de
    fortalezas/debilidades/recomendaciones/plan de mejora, y por cada respuesta la comparación
    con la respuesta modelo (`GET results`).
  - **Historial** — lista de sesiones del usuario (`GET interviews`) → abre resultados.

---

## 2. Arquitectura y tecnologías

- **Vite + React + TypeScript** (SPA).
- **Tailwind + shadcn/ui** (primitivos Radix copiados a `components/ui`). Dark/light con variables
  CSS de shadcn y un toggle persistido en `localStorage`.
- **Routing:** React Router v6. `ProtectedRoute` redirige a `/login` si no hay JWT válido.
- **Estado de servidor:** React Query (TanStack Query). Queries: professions, options, history,
  results. Mutations: register, login, create-interview, submit-answer, finish.
- **Estado de cliente:** Zustand.
  - `authStore` — `token`, `user` (name/email), acciones login/logout; persistido en localStorage.
  - `interviewStore` — sesión activa: `sessionId`, pregunta actual, índice/total, marca de tiempo
    de inicio de la pregunta (para calcular `responseTimeMs`), estado del temporizador.
- **Cliente API:** `lib/api.ts` — wrapper `fetch` tipado. Inyecta `Authorization: Bearer <token>`;
  parsea respuestas; ante error mapea el cuerpo `{message}` a un `ApiError` tipado; ante 401 limpia
  `authStore` y redirige a login. Exporta tipos TS que reflejan los DTOs del backend.
- **Formularios:** react-hook-form + zod (auth y wizard).
- **Gráficos:** `recharts` (RadarChart) para las 8 dimensiones.
- **Feedback UI:** toasts (sonner) + skeletons de carga.

---

## 3. Estructura de carpetas (feature-based)

```
frontend/
├── index.html
├── package.json, vite.config.ts, tsconfig.json, tailwind.config.js, postcss.config.js
├── components.json            (config de shadcn)
└── src/
    ├── main.tsx               (providers: QueryClient, ThemeProvider, Router)
    ├── App.tsx                (definición de rutas)
    ├── index.css              (Tailwind + variables de tema)
    ├── lib/
    │   ├── api.ts             (cliente fetch tipado + tipos de DTOs + ApiError)
    │   └── queryClient.ts
    ├── stores/
    │   ├── authStore.ts
    │   └── interviewStore.ts
    ├── theme/
    │   └── ThemeProvider.tsx
    ├── components/
    │   ├── ui/                (componentes shadcn: button, card, input, etc.)
    │   ├── Layout.tsx         (shell autenticado: nav + contenido)
    │   ├── ProtectedRoute.tsx
    │   ├── ThemeToggle.tsx
    │   └── ScoreRadar.tsx     (radar de 8 dimensiones)
    └── features/
        ├── auth/        LoginPage.tsx, RegisterPage.tsx, useAuth.ts
        ├── dashboard/   DashboardPage.tsx
        ├── interview/   ConfigWizardPage.tsx, InterviewPage.tsx, ResultsPage.tsx, hooks.ts
        └── history/     HistoryPage.tsx
```

Cada feature es una unidad acotada. `lib/api.ts` es la **única frontera** con el backend: cambiar
el backend solo afecta ese archivo y sus tipos.

---

## 4. Sistema de diseño (sobrio + gamificación sutil)

- **Color:** base neutra (zinc/slate); un acento primario (índigo/violeta) para CTAs y foco;
  semáforo (rojo < 50, ámbar 50–74, verde ≥ 75) **solo** para bandas de puntaje, alineado con los
  umbrales del backend.
- **Tipografía:** Inter; jerarquía clara; espaciado generoso; dashboard a base de cards.
- **Gamificación medida:** ring de progreso del puntaje global, contador de racha de práctica,
  badges de logros simples en el dashboard, y reveal animado del puntaje en resultados. Sin saturar.
- **Responsive** (móvil → escritorio) y **dark/light** completos.

---

## 5. Flujo de datos y manejo de errores

- Toda llamada pasa por `lib/api.ts`. Errores del backend (`{message}`) → `ApiError` → React Query
  → toast + mensaje inline contextual. **401** → logout + redirect a `/login`.
- **Medición de tiempo de respuesta:** `interviewStore` guarda el timestamp al mostrar cada pregunta;
  al enviar la respuesta calcula `responseTimeMs = now - shownAt` y lo manda en `POST answers`.
- **Estados de carga:** skeletons (dashboard, resultados) y spinners en acciones (enviar respuesta,
  finalizar). Estados vacíos con mensajes claros (p. ej. historial vacío → CTA a primera entrevista).

---

## 6. Testing

- **Vitest + React Testing Library** para componentes y hooks.
- **MSW (Mock Service Worker)** para simular la API del backend en tests, sin backend real.
- Cobertura objetivo del MVP: render y validación de auth/wizard; un **test del flujo de entrevista
  de punta a punta** (configurar → responder preguntas → finalizar → ver resultados) con MSW;
  render del radar y las listas de feedback a partir de un `results` simulado.

---

## 7. Fuera de alcance del frontend MVP (explícito)

Entrevistas por voz/video, análisis de lenguaje, generación de CV, simulación de empresas conocidas,
comparación histórica avanzada, exportación PDF y la gamificación completa (ligas, niveles, XP). El
sistema de diseño deja espacio para añadirlos en fases posteriores. Múltiples profesiones dependen
del seed del backend (hoy solo "Desarrollo de Software").

---

## 8. Construcción por fases (insumo para el plan)

1. Scaffold (Vite+TS) + Tailwind + shadcn + tema dark/light + layout + `lib/api.ts` base + tooling de test (Vitest+MSW).
2. Cliente API tipado completo + `authStore` + login/registro + `ProtectedRoute`.
3. Dashboard + historial (queries de sesiones).
4. Wizard de configuración (professions/options → crear sesión).
5. Pantalla de entrevista (chat + temporizador + envío + medición de tiempo).
6. Resultados + `ScoreRadar` + listas de feedback + comparación con respuesta modelo.
7. Pulido + gamificación (ring/racha/badges/animaciones) + estados vacíos/carga.

---

## Criterios de éxito del frontend MVP

Un usuario puede, desde el navegador: registrarse/iniciar sesión; ver su dashboard; configurar una
entrevista de Desarrollo de Software; responder el set de preguntas con temporizador y autoevaluación;
finalizar y ver un reporte con puntaje global, radar de 8 dimensiones, fortalezas/debilidades,
recomendaciones, plan y comparación con respuestas modelo; y reabrir sesiones desde el historial.
La app es responsive, soporta dark/light, y los tests (Vitest+MSW) pasan, incluyendo el flujo
end-to-end de entrevista.
