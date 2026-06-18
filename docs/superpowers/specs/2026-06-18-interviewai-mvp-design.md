# InterviewAI — Diseño del MVP (Fase 1)

**Fecha:** 2026-06-18
**Estado:** Aprobado para implementación
**Alcance:** Primera fase de una plataforma SaaS de simulación de entrevistas laborales por fases.

---

## Contexto y decisiones de alcance

InterviewAI es una plataforma de simulación de entrevistas laborales para cualquier sector
profesional. La visión completa incluye múltiples subsistemas (voz, video, análisis de lenguaje,
generación de CV, gamificación avanzada, simulación de empresas conocidas). Esa visión es
demasiado grande para un solo ciclo de diseño/implementación, por lo que se construye **por fases**,
cada una usable de punta a punta.

### Decisiones tomadas en brainstorming

1. **Enfoque por fases**, empezando por un MVP real y demostrable.
2. **Sin LLM en el MVP.** El motor de "IA" del entrevistador es, por ahora, un banco de preguntas
   predefinido + un motor de scoring por reglas. El código queda preparado con costuras limpias
   para enchufar Claude (Anthropic) más adelante.
3. **MVP = slice vertical completo:** auth → configurar entrevista → responder preguntas de un
   banco → recibir scoring por reglas + feedback. Una profesión inicial (Desarrollo de Software),
   ampliable por datos.
4. **Scoring = reglas + autoevaluación:** heurísticas automáticas (longitud, palabras clave,
   tiempo de respuesta) combinadas con la autoevaluación de confianza del usuario. Etiquetado de
   forma transparente como evaluación heurística, no "IA".

### Hoja de ruta de fases (referencia, no parte de este spec)

1. **MVP (este spec):** Fundación + Auth + entrevista por texto + scoring por reglas + feedback.
2. Evaluación y feedback enriquecidos.
3. Dashboard + gamificación + logros + exportación PDF.
4. Avanzado: voz, video, análisis de lenguaje, generación de CV, simulación de empresas.
5. Integración de LLM real (Claude) en las costuras `QuestionProvider` / `AnswerEvaluator`.

---

## 1. Arquitectura general

Monorepo con dos aplicaciones independientes:

```
EntrevistadorIA/
├── backend/    → Spring Boot (Java 21), REST API, PostgreSQL, JWT, Swagger
├── frontend/   → React + TypeScript + Vite, Tailwind, React Query, Zustand
└── docs/       → especificaciones y planes
```

**Principio rector — data-driven:** profesiones, niveles, tipos y preguntas viven en la base de
datos, no en el código. Añadir una nueva profesión = insertar filas (vía seed/migración), no
programar. El MVP carga una profesión completa (Desarrollo de Software) como semilla.

**Costura para IA futura:** el backend define dos interfaces de dominio:

- `QuestionProvider` — selecciona/secuencia preguntas para una sesión.
- `AnswerEvaluator` — evalúa una respuesta y produce puntajes por dimensión.

Implementaciones del MVP: `BankQuestionProvider` y `RuleBasedEvaluator`. La integración futura de
Claude añade nuevas implementaciones sin reescribir la lógica de orquestación.

**Niveles soportados (config):** Practicante, Junior, Semi Senior, Senior, Líder, Gerente.
**Tipos soportados (config):** Técnica, Recursos Humanos, Situacional, Competencias, Liderazgo, Mixta.

---

## 2. Modelo de datos (MVP)

Gestionado con migraciones (Flyway).

- **users** — `id`, `email` (único), `password_hash` (BCrypt), `name`, `created_at`.
- **professions** — `id`, `slug` (único), `name`, `description`.
- **questions** — `id`, `profession_id` (FK), `level`, `type`, `language`, `text`,
  `expected_keywords` (jsonb: lista de palabras/frases clave), `model_answer` (text),
  `target_dimensions` (jsonb: dimensiones que la pregunta evalúa, con peso).
- **interview_sessions** — `id`, `user_id` (FK), `profession_id` (FK), `role_title` (cargo),
  `target_company`, `industry`, `level`, `type`, `language`, `duration_minutes`, `status`
  (CREATED | IN_PROGRESS | FINISHED), `started_at`, `finished_at`, `overall_score`.
- **interview_answers** — `id`, `session_id` (FK), `question_id` (FK), `answer_text`,
  `response_time_ms`, `self_confidence` (1–5), `dimension_scores` (jsonb), `created_at`.
- **session_feedback** — `id`, `session_id` (FK, único), `strengths` (jsonb), `weaknesses` (jsonb),
  `recommendations` (jsonb), `improvement_plan` (jsonb).

### Las 8 dimensiones de evaluación

Comunicación, Claridad, Seguridad, Pensamiento crítico, Resolución de problemas,
Conocimiento del área, Liderazgo, Trabajo en equipo. Representadas como un enum/constante
compartida; los puntajes por dimensión son 0–100.

---

## 3. Flujo de entrevista (frontend)

1. **Dashboard** — saludo, resumen, botón "Nueva entrevista", lista de entrevistas pasadas.
2. **Wizard de configuración** — profesión, cargo, empresa objetivo, industria, nivel, tipo,
   idioma, duración. Validación de campos obligatorios.
3. **Pantalla de entrevista** — layout tipo chat: una pregunta a la vez, temporizador visible,
   caja de respuesta y, al enviar, un slider de autoevaluación de confianza (1–5). Avance hasta
   completar el set de preguntas o agotar la duración.
4. **Resultados** — puntaje global, radar de las 8 dimensiones, fortalezas, debilidades,
   recomendaciones, plan de mejora y comparación de cada respuesta con su respuesta modelo.
5. **Historial** — sesiones finalizadas accesibles desde el dashboard.

Las preguntas de **seguimiento dinámicas** quedan fuera del MVP (requieren LLM para no ser
artificiales).

---

## 4. Motor de scoring (por reglas + autoevaluación)

`RuleBasedEvaluator` evalúa cada respuesta combinando señales:

- **Longitud** — penaliza respuestas demasiado escuetas; premia desarrollo razonable (con tope
  para no premiar verborrea).
- **Cobertura de palabras clave** — proporción de `expected_keywords` presentes en la respuesta.
- **Tiempo de respuesta** — dentro de una banda razonable según la duración configurada.
- **Autoevaluación de confianza** — el `self_confidence` del usuario (1–5).

Cada pregunta declara sus `target_dimensions` con pesos; las señales se proyectan sobre esas
dimensiones (0–100). Agregación por sesión → promedio por dimensión + puntaje global.

`session_feedback` se genera por umbrales: dimensión > umbral_alto → fortaleza; < umbral_bajo →
debilidad. Recomendaciones y plan de mejora se construyen con plantillas asociadas a cada
dimensión débil. **Transparencia:** la UI etiqueta esto como evaluación heurística, no "IA".

---

## 5. API + Seguridad

REST bajo `/api`. Documentado con Swagger (springdoc-openapi) en `/swagger-ui`.

**Auth (público):**
- `POST /api/auth/register` — crea usuario, devuelve JWT.
- `POST /api/auth/login` — valida credenciales, devuelve JWT.

**Recursos (requieren JWT):**
- `GET /api/professions` — lista profesiones disponibles.
- `GET /api/professions/{id}/options` — niveles/tipos/idiomas disponibles para configurar.
- `POST /api/interviews` — crea sesión con la config; estado CREATED.
- `GET /api/interviews/{id}/next-question` — siguiente pregunta de la sesión.
- `POST /api/interviews/{id}/answers` — registra respuesta (texto, tiempo, autoevaluación).
- `POST /api/interviews/{id}/finish` — calcula scoring + feedback; estado FINISHED.
- `GET /api/interviews/{id}/results` — puntajes + feedback de la sesión.
- `GET /api/interviews` — historial del usuario autenticado.

**Seguridad:** Spring Security con filtro JWT stateless. Contraseñas con BCrypt. Las sesiones de
entrevista pertenecen al usuario autenticado; un usuario solo accede a las suyas.

---

## 6. Frontend — estado y diseño

- **React Query** — fetching/caché de datos del servidor (profesiones, sesiones, resultados).
- **Zustand** — estado de cliente: sesión de auth (token, usuario) y estado de la entrevista activa
  (pregunta actual, temporizador, progreso).
- **Rutas protegidas** — redirigen a login si no hay JWT válido.
- **Diseño** — premium, inspirado en Linear / Notion / Stripe. Dark/Light mode con toggle
  persistente. Responsive. Tailwind como sistema de diseño. La gamificación/logros completos son
  de la Fase 3, pero el sistema visual los soporta desde el inicio. Durante la implementación del
  frontend se aplica la skill de diseño para evitar un resultado genérico.

---

## 7. Fuera de alcance del MVP (explícito)

Voz, video, análisis de lenguaje corporal, generación de CV, simulación de empresas conocidas,
comparación histórica avanzada, exportación PDF, logros/gamificación completos, preguntas de
seguimiento dinámicas, integración de LLM real, múltiples profesiones cargadas (solo una semilla).
Todo esto se aborda en fases posteriores.

---

## Criterios de éxito del MVP

Un usuario puede: registrarse e iniciar sesión; configurar una entrevista de Desarrollo de Software;
responder un set de preguntas con temporizador y autoevaluación; finalizar y ver un reporte con
puntaje global, las 8 dimensiones, fortalezas/debilidades, recomendaciones y plan de mejora; y
volver a ver esa sesión en su historial. El backend expone Swagger funcional y todo está
preparado por interfaces para enchufar un LLM después.
