# InterviewAI Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the InterviewAI MVP REST API: JWT auth, data-driven interview configuration, a rule-based scoring engine, and feedback generation, all documented with Swagger and seeded with one complete profession (Software Development).

**Architecture:** Spring Boot layered app (controller → service → repository) over PostgreSQL with Flyway migrations. Two domain seams — `QuestionProvider` and `AnswerEvaluator` — isolate interview-question selection and answer scoring so a real LLM can replace the MVP heuristics later without touching orchestration. Stateless JWT security.

**Tech Stack:** Java 21, Spring Boot 3.5.15, Spring Security, Spring Data JPA, PostgreSQL, Flyway, springdoc-openapi (Swagger), jjwt, Maven (via bundled `mvnw` wrapper), JUnit 5 + Spring Boot Test + Zonky embedded-postgres.

> **ENVIRONMENT NOTE (read first):** The project is ALREADY scaffolded via Spring Initializr at `backend/`. Do NOT create `pom.xml`, the Maven wrapper, or the main application class — they exist. The main class is `com.interviewai.InterviewaiBackendApplication`. The `pom.xml` already includes web, data-jpa, security, validation, actuator, flyway-core, flyway-database-postgresql, postgresql, springdoc 2.8.9, jjwt 0.12.6, spring-boot-starter-test, spring-security-test, and `io.zonky.test:embedded-postgres` 2.0.7 (test scope). Build/test with `./mvnw` (Windows: `.\mvnw.cmd`). Docker is NOT available — tests use embedded-postgres (verified working, boots real PostgreSQL 14).

## Global Constraints

- Java 21 (`<java.version>21</java.version>`). Build via `./mvnw` / `.\mvnw.cmd` (no system Maven).
- All REST endpoints are under `/api`. Swagger UI served at `/swagger-ui.html`.
- Passwords hashed with BCrypt. Auth is stateless JWT (no server sessions).
- Schema and seed data managed ONLY through Flyway migrations (no `ddl-auto=update`; use `validate`).
- The 8 evaluation dimensions, fixed everywhere: `COMMUNICATION`, `CLARITY`, `CONFIDENCE`, `CRITICAL_THINKING`, `PROBLEM_SOLVING`, `DOMAIN_KNOWLEDGE`, `LEADERSHIP`, `TEAMWORK`. Dimension scores are integers 0–100.
- Levels: `INTERN`, `JUNIOR`, `SEMI_SENIOR`, `SENIOR`, `LEAD`, `MANAGER`. Interview types: `TECHNICAL`, `HR`, `SITUATIONAL`, `COMPETENCY`, `LEADERSHIP`, `MIXED`.
- A user may only access interview sessions they own (enforced in service layer; return 404 for others' sessions).
- Integration tests extend the shared `com.interviewai.support.PostgresIT` base (Task 1), which boots a Zonky embedded PostgreSQL and wires `spring.datasource.*` via `@DynamicPropertySource`. Do NOT use Testcontainers or H2 (jsonb requires real Postgres).

---

## File Structure

```
backend/
├── pom.xml
├── src/main/resources/
│   ├── application.yml
│   └── db/migration/
│       ├── V1__schema.sql
│       └── V2__seed_software_development.sql
├── src/main/java/com/interviewai/
│   ├── InterviewAiApplication.java
│   ├── common/
│   │   ├── Dimension.java            (enum, 8 dimensions)
│   │   ├── Level.java                (enum)
│   │   ├── InterviewType.java        (enum)
│   │   └── ApiExceptionHandler.java  (@RestControllerAdvice)
│   ├── config/
│   │   ├── SecurityConfig.java
│   │   └── OpenApiConfig.java
│   ├── auth/
│   │   ├── User.java                 (@Entity)
│   │   ├── UserRepository.java
│   │   ├── JwtService.java
│   │   ├── JwtAuthFilter.java
│   │   ├── AuthService.java
│   │   ├── AuthController.java
│   │   └── dto/ (RegisterRequest, LoginRequest, AuthResponse)
│   ├── profession/
│   │   ├── Profession.java           (@Entity)
│   │   ├── ProfessionRepository.java
│   │   ├── ProfessionController.java
│   │   └── dto/ (ProfessionDto, OptionsDto)
│   ├── question/
│   │   ├── Question.java             (@Entity, jsonb fields)
│   │   ├── QuestionRepository.java
│   │   ├── QuestionProvider.java     (interface — SEAM)
│   │   └── BankQuestionProvider.java (MVP impl)
│   └── interview/
│       ├── InterviewSession.java     (@Entity)
│       ├── InterviewAnswer.java      (@Entity)
│       ├── SessionFeedback.java      (@Entity)
│       ├── InterviewSessionRepository.java
│       ├── InterviewAnswerRepository.java
│       ├── SessionFeedbackRepository.java
│       ├── AnswerEvaluator.java      (interface — SEAM)
│       ├── RuleBasedEvaluator.java   (MVP impl)
│       ├── FeedbackGenerator.java
│       ├── InterviewService.java
│       ├── InterviewController.java
│       └── dto/ (CreateInterviewRequest, QuestionDto, SubmitAnswerRequest, ResultsDto, SessionSummaryDto)
└── src/test/java/com/interviewai/...  (mirrors main)
```

Each file has one responsibility. The two interfaces (`QuestionProvider`, `AnswerEvaluator`) are the LLM seams. DTOs live beside their feature. jsonb fields use a JdbcType mapping (`@JdbcTypeCode(SqlTypes.JSON)`).

---

## Task 1: Test base (embedded-postgres) + config + health check

The app is already scaffolded (Initializr). This task adds the shared embedded-postgres
test base, the runtime DB/JWT config, a placeholder migration, and a health-check IT.

**Files:**
- Create: `backend/src/test/java/com/interviewai/support/PostgresIT.java`
- Create: `backend/src/main/resources/application.yml` (and delete the generated `application.properties`)
- Create: `backend/src/main/resources/db/migration/V1__schema.sql` (placeholder; replaced in Task 2)
- Create: `backend/src/test/java/com/interviewai/HealthCheckIT.java`

**Interfaces:**
- Produces: `com.interviewai.support.PostgresIT` — abstract base that boots a Zonky embedded
  PostgreSQL once per JVM (static) and registers `spring.datasource.url/username/password` via
  `@DynamicPropertySource`. All later ITs extend it. App config exposes `app.jwt.secret` and
  `app.jwt.expiration-ms`.

- [ ] **Step 1: Create the shared embedded-postgres test base**

```java
// backend/src/test/java/com/interviewai/support/PostgresIT.java
package com.interviewai.support;

import io.zonky.test.db.postgres.embedded.EmbeddedPostgres;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import java.io.IOException;

/** Boots a real PostgreSQL (Zonky embedded, no Docker) shared across all ITs. */
public abstract class PostgresIT {
    static final EmbeddedPostgres POSTGRES;
    static {
        try {
            POSTGRES = EmbeddedPostgres.start();
        } catch (IOException e) {
            throw new ExceptionInInitializerError(e);
        }
    }

    @DynamicPropertySource
    static void datasourceProps(DynamicPropertyRegistry r) {
        r.add("spring.datasource.url", () -> POSTGRES.getJdbcUrl("postgres", "postgres"));
        r.add("spring.datasource.username", () -> "postgres");
        r.add("spring.datasource.password", () -> "postgres");
    }
}
```

- [ ] **Step 2: Write the failing health-check IT**

```java
// backend/src/test/java/com/interviewai/HealthCheckIT.java
package com.interviewai;

import com.interviewai.support.PostgresIT;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class HealthCheckIT extends PostgresIT {

    @Autowired MockMvc mockMvc;

    @Test
    void actuatorHealthIsUp() throws Exception {
        mockMvc.perform(get("/actuator/health")).andExpect(status().isOk());
    }
}
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd backend && .\mvnw.cmd -q test -Dtest=HealthCheckIT`
Expected: FAIL — Flyway/JPA cannot validate against an empty schema (no migration yet),
or `app.jwt.*` config missing. This drives Steps 4–5.

- [ ] **Step 4: Create application config (replace the generated `application.properties`)**

Delete `backend/src/main/resources/application.properties`, then create:

```yaml
# backend/src/main/resources/application.yml
spring:
  application:
    name: interviewai
  datasource:
    url: ${DB_URL:jdbc:postgresql://localhost:5432/interviewai}
    username: ${DB_USER:interviewai}
    password: ${DB_PASSWORD:interviewai}
  jpa:
    hibernate:
      ddl-auto: validate
    open-in-view: false
  flyway:
    enabled: true
app:
  jwt:
    secret: ${JWT_SECRET:dev-secret-change-me-this-must-be-at-least-32-bytes-long}
    expiration-ms: 86400000
springdoc:
  swagger-ui:
    path: /swagger-ui.html
```

- [ ] **Step 5: Add a placeholder migration so Flyway/validate succeeds**

```sql
-- backend/src/main/resources/db/migration/V1__schema.sql
-- placeholder; real schema added in Task 2
CREATE TABLE IF NOT EXISTS _bootstrap (id INT PRIMARY KEY);
```

- [ ] **Step 6: Run test to verify it passes**

Run: `cd backend && .\mvnw.cmd -q test -Dtest=HealthCheckIT`
Expected: PASS (embedded Postgres boots, Flyway runs V1, actuator health 200).

- [ ] **Step 7: Commit**

```bash
git add backend/src
git rm --cached backend/src/main/resources/application.properties 2>/dev/null || true
git commit -m "feat(backend): embedded-postgres test base, app config, health check IT"
```

---

## Task 2: Database schema + seed migration

**Files:**
- Modify: `backend/src/main/resources/db/migration/V1__schema.sql` (replace placeholder)
- Create: `backend/src/main/resources/db/migration/V2__seed_software_development.sql`
- Create: `backend/src/test/java/com/interviewai/migration/MigrationIT.java`

**Interfaces:**
- Produces: tables `users`, `professions`, `questions`, `interview_sessions`, `interview_answers`, `session_feedback`; one seeded profession (`software-development`) with ≥6 questions.

- [ ] **Step 1: Write the failing test**

```java
// backend/src/test/java/com/interviewai/migration/MigrationIT.java
package com.interviewai.migration;

import com.interviewai.support.PostgresIT;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class MigrationIT extends PostgresIT {

    @Autowired JdbcTemplate jdbc;

    @Test
    void seedsSoftwareDevelopmentProfessionWithQuestions() {
        Integer professions = jdbc.queryForObject(
            "SELECT count(*) FROM professions WHERE slug = 'software-development'", Integer.class);
        assertThat(professions).isEqualTo(1);

        Integer questions = jdbc.queryForObject(
            "SELECT count(*) FROM questions q JOIN professions p ON q.profession_id = p.id " +
            "WHERE p.slug = 'software-development'", Integer.class);
        assertThat(questions).isGreaterThanOrEqualTo(6);
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && ./mvnw -q test -Dtest=MigrationIT`
Expected: FAIL (relation "professions" does not exist).

- [ ] **Step 3: Write `V1__schema.sql`**

```sql
CREATE TABLE users (
    id          BIGSERIAL PRIMARY KEY,
    email       VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name        VARCHAR(255) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE professions (
    id          BIGSERIAL PRIMARY KEY,
    slug        VARCHAR(120) NOT NULL UNIQUE,
    name        VARCHAR(255) NOT NULL,
    description TEXT
);

CREATE TABLE questions (
    id                BIGSERIAL PRIMARY KEY,
    profession_id     BIGINT NOT NULL REFERENCES professions(id),
    level             VARCHAR(40) NOT NULL,
    type              VARCHAR(40) NOT NULL,
    language          VARCHAR(10) NOT NULL DEFAULT 'es',
    text              TEXT NOT NULL,
    expected_keywords JSONB NOT NULL DEFAULT '[]',
    model_answer      TEXT NOT NULL,
    target_dimensions JSONB NOT NULL DEFAULT '{}'
);
CREATE INDEX idx_questions_lookup ON questions(profession_id, level, type, language);

CREATE TABLE interview_sessions (
    id               BIGSERIAL PRIMARY KEY,
    user_id          BIGINT NOT NULL REFERENCES users(id),
    profession_id    BIGINT NOT NULL REFERENCES professions(id),
    role_title       VARCHAR(255) NOT NULL,
    target_company   VARCHAR(255),
    industry         VARCHAR(255),
    level            VARCHAR(40) NOT NULL,
    type             VARCHAR(40) NOT NULL,
    language         VARCHAR(10) NOT NULL DEFAULT 'es',
    duration_minutes INT NOT NULL,
    status           VARCHAR(20) NOT NULL DEFAULT 'CREATED',
    overall_score    INT,
    started_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    finished_at      TIMESTAMPTZ
);
CREATE INDEX idx_sessions_user ON interview_sessions(user_id);

CREATE TABLE interview_answers (
    id               BIGSERIAL PRIMARY KEY,
    session_id       BIGINT NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
    question_id      BIGINT NOT NULL REFERENCES questions(id),
    answer_text      TEXT NOT NULL,
    response_time_ms BIGINT NOT NULL,
    self_confidence  INT NOT NULL,
    dimension_scores JSONB NOT NULL DEFAULT '{}',
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_answers_session ON interview_answers(session_id);

CREATE TABLE session_feedback (
    id               BIGSERIAL PRIMARY KEY,
    session_id       BIGINT NOT NULL UNIQUE REFERENCES interview_sessions(id) ON DELETE CASCADE,
    strengths        JSONB NOT NULL DEFAULT '[]',
    weaknesses       JSONB NOT NULL DEFAULT '[]',
    recommendations  JSONB NOT NULL DEFAULT '[]',
    improvement_plan JSONB NOT NULL DEFAULT '[]'
);
```

- [ ] **Step 4: Write `V2__seed_software_development.sql`**

```sql
INSERT INTO professions (slug, name, description) VALUES
  ('software-development', 'Desarrollo de Software',
   'Entrevistas para roles de ingeniería y desarrollo de software.');

-- helper: capture the id
DO $$
DECLARE pid BIGINT;
BEGIN
  SELECT id INTO pid FROM professions WHERE slug = 'software-development';

  INSERT INTO questions (profession_id, level, type, language, text, expected_keywords, model_answer, target_dimensions) VALUES
  (pid, 'JUNIOR', 'TECHNICAL', 'es',
   'Explica la diferencia entre una lista y un arreglo, y cuándo usarías cada uno.',
   '["memoria","tamaño dinámico","índice","contiguo","complejidad"]',
   'Un arreglo tiene tamaño fijo y memoria contigua con acceso O(1) por índice; una lista enlazada crece dinámicamente con inserción O(1) pero acceso O(n). Se usa arreglo cuando el tamaño es conocido y se prioriza el acceso; lista cuando hay muchas inserciones/eliminaciones.',
   '{"DOMAIN_KNOWLEDGE":0.6,"CLARITY":0.4}'),

  (pid, 'JUNIOR', 'TECHNICAL', 'es',
   '¿Qué es una API REST y cuáles son sus principios principales?',
   '["HTTP","stateless","recursos","verbos","JSON","endpoints"]',
   'Una API REST expone recursos vía HTTP usando verbos (GET, POST, PUT, DELETE), es stateless, usa URIs para identificar recursos y normalmente intercambia JSON. Principios: cliente-servidor, sin estado, cacheable, interfaz uniforme.',
   '{"DOMAIN_KNOWLEDGE":0.6,"COMMUNICATION":0.4}'),

  (pid, 'JUNIOR', 'SITUATIONAL', 'es',
   'Cuéntame de una vez que tuviste un bug difícil. ¿Cómo lo resolviste?',
   '["reproducir","logs","hipótesis","aislar","prueba","causa raíz"]',
   'Describir el problema, cómo lo reproduje, el uso de logs/debugger para formar hipótesis, cómo aislé la causa raíz y verifiqué el fix con una prueba. Mostrar método y aprendizaje.',
   '{"PROBLEM_SOLVING":0.5,"CRITICAL_THINKING":0.3,"COMMUNICATION":0.2}'),

  (pid, 'JUNIOR', 'HR', 'es',
   '¿Por qué quieres trabajar en esta empresa y este rol?',
   '["motivación","valores","impacto","crecimiento","producto"]',
   'Conectar motivación personal con la misión/producto de la empresa, mostrar investigación previa y cómo el rol encaja con mi crecimiento y el impacto que quiero generar.',
   '{"COMMUNICATION":0.4,"CONFIDENCE":0.4,"DOMAIN_KNOWLEDGE":0.2}'),

  (pid, 'JUNIOR', 'COMPETENCY', 'es',
   'Describe una situación en la que trabajaste en equipo para entregar algo bajo presión.',
   '["colaboración","comunicación","prioridades","roles","entrega"]',
   'Situación-Tarea-Acción-Resultado: contexto del equipo, cómo nos coordinamos, comunicación de prioridades y el resultado entregado a tiempo, con mi contribución concreta.',
   '{"TEAMWORK":0.5,"COMMUNICATION":0.3,"PROBLEM_SOLVING":0.2}'),

  (pid, 'SENIOR', 'TECHNICAL', 'es',
   'Diseña a alto nivel un sistema para acortar URLs (tipo bit.ly). ¿Qué componentes consideras?',
   '["base de datos","hash","caché","escalabilidad","balanceo","colisiones","redirección"]',
   'Servicio de generación de IDs (hash/base62), almacenamiento clave-valor, caché para lecturas, manejo de colisiones, redirección 301/302, particionado y CDN para escala. Discutir trade-offs de consistencia y latencia.',
   '{"PROBLEM_SOLVING":0.4,"DOMAIN_KNOWLEDGE":0.4,"CRITICAL_THINKING":0.2}'),

  (pid, 'LEAD', 'LEADERSHIP', 'es',
   'Un miembro de tu equipo tiene bajo desempeño sostenido. ¿Cómo lo manejas?',
   '["feedback","expectativas","empatía","plan","seguimiento","uno a uno"]',
   'Conversación 1:1 con datos concretos y empatía, entender causas, alinear expectativas, acordar un plan de mejora medible con seguimiento, y escalar a RRHH si no hay progreso. Equilibrar al individuo y al equipo.',
   '{"LEADERSHIP":0.5,"COMMUNICATION":0.3,"CRITICAL_THINKING":0.2}');
END $$;
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd backend && ./mvnw -q test -Dtest=MigrationIT`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add backend/src/main/resources/db backend/src/test/java/com/interviewai/migration
git commit -m "feat(backend): add schema and Software Development seed migrations"
```

---

## Task 3: Common enums + JSON converters

**Files:**
- Create: `backend/src/main/java/com/interviewai/common/Dimension.java`
- Create: `backend/src/main/java/com/interviewai/common/Level.java`
- Create: `backend/src/main/java/com/interviewai/common/InterviewType.java`
- Create: `backend/src/test/java/com/interviewai/common/DimensionTest.java`

**Interfaces:**
- Produces: `enum Dimension` with values `COMMUNICATION, CLARITY, CONFIDENCE, CRITICAL_THINKING, PROBLEM_SOLVING, DOMAIN_KNOWLEDGE, LEADERSHIP, TEAMWORK` and `String spanishLabel()`; `enum Level`; `enum InterviewType`.

- [ ] **Step 1: Write the failing test**

```java
// backend/src/test/java/com/interviewai/common/DimensionTest.java
package com.interviewai.common;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

class DimensionTest {
    @Test
    void hasEightDimensions() {
        assertThat(Dimension.values()).hasSize(8);
    }

    @Test
    void exposesSpanishLabel() {
        assertThat(Dimension.COMMUNICATION.spanishLabel()).isEqualTo("Comunicación");
        assertThat(Dimension.TEAMWORK.spanishLabel()).isEqualTo("Trabajo en equipo");
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && ./mvnw -q test -Dtest=DimensionTest`
Expected: FAIL (cannot find symbol Dimension).

- [ ] **Step 3: Write the enums**

```java
// Dimension.java
package com.interviewai.common;

public enum Dimension {
    COMMUNICATION("Comunicación"),
    CLARITY("Claridad"),
    CONFIDENCE("Seguridad"),
    CRITICAL_THINKING("Pensamiento crítico"),
    PROBLEM_SOLVING("Resolución de problemas"),
    DOMAIN_KNOWLEDGE("Conocimiento del área"),
    LEADERSHIP("Liderazgo"),
    TEAMWORK("Trabajo en equipo");

    private final String spanishLabel;
    Dimension(String spanishLabel) { this.spanishLabel = spanishLabel; }
    public String spanishLabel() { return spanishLabel; }
}
```

```java
// Level.java
package com.interviewai.common;
public enum Level { INTERN, JUNIOR, SEMI_SENIOR, SENIOR, LEAD, MANAGER }
```

```java
// InterviewType.java
package com.interviewai.common;
public enum InterviewType { TECHNICAL, HR, SITUATIONAL, COMPETENCY, LEADERSHIP, MIXED }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && ./mvnw -q test -Dtest=DimensionTest`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/main/java/com/interviewai/common backend/src/test/java/com/interviewai/common
git commit -m "feat(backend): add domain enums (Dimension, Level, InterviewType)"
```

---

## Task 4: JWT auth (register + login)

**Files:**
- Create: `backend/src/main/java/com/interviewai/auth/User.java`
- Create: `backend/src/main/java/com/interviewai/auth/UserRepository.java`
- Create: `backend/src/main/java/com/interviewai/auth/JwtService.java`
- Create: `backend/src/main/java/com/interviewai/auth/JwtAuthFilter.java`
- Create: `backend/src/main/java/com/interviewai/auth/AuthService.java`
- Create: `backend/src/main/java/com/interviewai/auth/AuthController.java`
- Create: `backend/src/main/java/com/interviewai/auth/dto/RegisterRequest.java`, `LoginRequest.java`, `AuthResponse.java`
- Create: `backend/src/main/java/com/interviewai/config/SecurityConfig.java`
- Create: `backend/src/main/java/com/interviewai/config/OpenApiConfig.java`
- Create: `backend/src/main/java/com/interviewai/common/ApiExceptionHandler.java`
- Create: `backend/src/test/java/com/interviewai/auth/AuthIT.java`

**Interfaces:**
- Consumes: nothing.
- Produces: `JwtService.generateToken(String email)`, `JwtService.extractEmail(String token)`; `AuthService.register(RegisterRequest)` and `login(LoginRequest)` returning `AuthResponse(String token, String name, String email)`; security context principal = user email (String). `UserRepository.findByEmail(String)`.

- [ ] **Step 1: Write the failing test**

```java
// backend/src/test/java/com/interviewai/auth/AuthIT.java
package com.interviewai.auth;

import com.interviewai.support.PostgresIT;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class AuthIT extends PostgresIT {

    @Autowired MockMvc mockMvc;

    @Test
    void registerThenLoginReturnsToken() throws Exception {
        String body = """
            {"name":"Ana","email":"ana@test.com","password":"secret123"}""";
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.token").isNotEmpty())
            .andExpect(jsonPath("$.name").value("Ana"));

        String login = """
            {"email":"ana@test.com","password":"secret123"}""";
        mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(login))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.token").isNotEmpty());
    }

    @Test
    void duplicateEmailIsRejected() throws Exception {
        String body = """
            {"name":"Bob","email":"bob@test.com","password":"secret123"}""";
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isOk());
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isConflict());
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

`PostgresIT` already exists from Task 1 — `AuthIT` extends it. Run:
`cd backend && .\mvnw.cmd -q test -Dtest=AuthIT`
Expected: FAIL (404 — no /api/auth endpoints).

- [ ] **Step 3: Write entity, repository, DTOs**

```java
// User.java
package com.interviewai.auth;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "users")
public class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true)
    private String email;
    @Column(name = "password_hash", nullable = false)
    private String passwordHash;
    @Column(nullable = false)
    private String name;
    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    public Long getId() { return id; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String h) { this.passwordHash = h; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
}
```

```java
// UserRepository.java
package com.interviewai.auth;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
}
```

```java
// dto/RegisterRequest.java
package com.interviewai.auth.dto;
import jakarta.validation.constraints.*;
public record RegisterRequest(
    @NotBlank String name,
    @Email @NotBlank String email,
    @Size(min = 8) String password) {}
```

```java
// dto/LoginRequest.java
package com.interviewai.auth.dto;
import jakarta.validation.constraints.*;
public record LoginRequest(@Email @NotBlank String email, @NotBlank String password) {}
```

```java
// dto/AuthResponse.java
package com.interviewai.auth.dto;
public record AuthResponse(String token, String name, String email) {}
```

- [ ] **Step 5: Write JwtService and JwtAuthFilter**

```java
// JwtService.java
package com.interviewai.auth;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Service
public class JwtService {
    private final SecretKey key;
    private final long expirationMs;

    public JwtService(@Value("${app.jwt.secret}") String secret,
                      @Value("${app.jwt.expiration-ms}") long expirationMs) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }

    public String generateToken(String email) {
        Date now = new Date();
        return Jwts.builder()
            .subject(email)
            .issuedAt(now)
            .expiration(new Date(now.getTime() + expirationMs))
            .signWith(key)
            .compact();
    }

    public String extractEmail(String token) {
        return Jwts.parser().verifyWith(key).build()
            .parseSignedClaims(token).getPayload().getSubject();
    }
}
```

```java
// JwtAuthFilter.java
package com.interviewai.auth;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.*;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {
    private final JwtService jwtService;
    public JwtAuthFilter(JwtService jwtService) { this.jwtService = jwtService; }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest req, @NonNull HttpServletResponse res,
                                    @NonNull FilterChain chain) throws ServletException, IOException {
        String header = req.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            try {
                String email = jwtService.extractEmail(header.substring(7));
                var auth = new UsernamePasswordAuthenticationToken(email, null, List.of());
                SecurityContextHolder.getContext().setAuthentication(auth);
            } catch (Exception ignored) {
                // invalid token -> remain unauthenticated
            }
        }
        chain.doFilter(req, res);
    }
}
```

- [ ] **Step 6: Write AuthService and AuthController**

```java
// AuthService.java
package com.interviewai.auth;

import com.interviewai.auth.dto.*;
import com.interviewai.common.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final JwtService jwt;

    public AuthService(UserRepository users, PasswordEncoder encoder, JwtService jwt) {
        this.users = users; this.encoder = encoder; this.jwt = jwt;
    }

    public AuthResponse register(RegisterRequest req) {
        if (users.existsByEmail(req.email()))
            throw new ApiException(HttpStatus.CONFLICT, "El email ya está registrado");
        User u = new User();
        u.setName(req.name());
        u.setEmail(req.email());
        u.setPasswordHash(encoder.encode(req.password()));
        users.save(u);
        return new AuthResponse(jwt.generateToken(u.getEmail()), u.getName(), u.getEmail());
    }

    public AuthResponse login(LoginRequest req) {
        User u = users.findByEmail(req.email())
            .filter(x -> encoder.matches(req.password(), x.getPasswordHash()))
            .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Credenciales inválidas"));
        return new AuthResponse(jwt.generateToken(u.getEmail()), u.getName(), u.getEmail());
    }
}
```

```java
// AuthController.java
package com.interviewai.auth;

import com.interviewai.auth.dto.*;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService auth;
    public AuthController(AuthService auth) { this.auth = auth; }

    @PostMapping("/register")
    public AuthResponse register(@Valid @RequestBody RegisterRequest req) { return auth.register(req); }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest req) { return auth.login(req); }
}
```

- [ ] **Step 7: Write ApiException + ApiExceptionHandler**

```java
// common/ApiException.java
package com.interviewai.common;
import org.springframework.http.HttpStatus;
public class ApiException extends RuntimeException {
    private final HttpStatus status;
    public ApiException(HttpStatus status, String message) { super(message); this.status = status; }
    public HttpStatus getStatus() { return status; }
}
```

```java
// common/ApiExceptionHandler.java
package com.interviewai.common;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestControllerAdvice
public class ApiExceptionHandler {
    @ExceptionHandler(ApiException.class)
    public ResponseEntity<Map<String, String>> handle(ApiException ex) {
        return ResponseEntity.status(ex.getStatus()).body(Map.of("message", ex.getMessage()));
    }
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidation(MethodArgumentNotValidException ex) {
        String msg = ex.getBindingResult().getFieldErrors().stream()
            .findFirst().map(e -> e.getField() + ": " + e.getDefaultMessage()).orElse("Datos inválidos");
        return ResponseEntity.badRequest().body(Map.of("message", msg));
    }
}
```

- [ ] **Step 8: Write SecurityConfig + OpenApiConfig**

```java
// config/SecurityConfig.java
package com.interviewai.config;

import com.interviewai.auth.JwtAuthFilter;
import org.springframework.context.annotation.*;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {
    private static final String[] PUBLIC = {
        "/api/auth/**", "/actuator/health",
        "/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs/**"
    };

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, JwtAuthFilter jwtFilter) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(a -> a
                .requestMatchers(PUBLIC).permitAll()
                .anyRequest().authenticated())
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(); }
}
```

```java
// config/OpenApiConfig.java
package com.interviewai.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(info = @Info(title = "InterviewAI API", version = "0.1.0"))
@SecurityScheme(name = "bearerAuth", type = SecuritySchemeType.HTTP, scheme = "bearer", bearerFormat = "JWT")
public class OpenApiConfig {}
```

- [ ] **Step 9: Run test to verify it passes**

Run: `cd backend && ./mvnw -q test -Dtest=AuthIT`
Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add backend/src
git commit -m "feat(backend): JWT auth (register/login), security config, error handling"
```

---

## Task 5: Profession endpoints + current-user helper

**Files:**
- Create: `backend/src/main/java/com/interviewai/profession/Profession.java`
- Create: `backend/src/main/java/com/interviewai/profession/ProfessionRepository.java`
- Create: `backend/src/main/java/com/interviewai/profession/dto/ProfessionDto.java`, `OptionsDto.java`
- Create: `backend/src/main/java/com/interviewai/profession/ProfessionController.java`
- Create: `backend/src/main/java/com/interviewai/auth/CurrentUser.java`
- Create: `backend/src/test/java/com/interviewai/profession/ProfessionIT.java`

**Interfaces:**
- Consumes: `UserRepository.findByEmail`, security principal (email String).
- Produces: `Profession` entity (`getId`, `getSlug`, `getName`, `getDescription`); `ProfessionRepository extends JpaRepository<Profession,Long>` with `findBySlug`; `CurrentUser.require()` returning the authenticated `User` (throws 401 if absent). `GET /api/professions`, `GET /api/professions/options`.

- [ ] **Step 1: Write the failing test**

```java
// backend/src/test/java/com/interviewai/profession/ProfessionIT.java
package com.interviewai.profession;

import com.interviewai.support.AuthenticatedIT;
import org.junit.jupiter.api.Test;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class ProfessionIT extends AuthenticatedIT {

    @Test
    void listsSeededProfession() throws Exception {
        mockMvc.perform(get("/api/professions").header("Authorization", bearer()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[?(@.slug=='software-development')]").exists());
    }

    @Test
    void rejectsUnauthenticated() throws Exception {
        mockMvc.perform(get("/api/professions"))
            .andExpect(status().isForbidden());
    }

    @Test
    void returnsConfigOptions() throws Exception {
        mockMvc.perform(get("/api/professions/options").header("Authorization", bearer()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.levels").isArray())
            .andExpect(jsonPath("$.types").isArray());
    }
}
```

- [ ] **Step 2: Create the authenticated IT base helper**

```java
// backend/src/test/java/com/interviewai/support/AuthenticatedIT.java
package com.interviewai.support;

import com.interviewai.auth.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import com.interviewai.auth.*;

@SpringBootTest
@AutoConfigureMockMvc
public abstract class AuthenticatedIT extends PostgresIT {
    @Autowired protected MockMvc mockMvc;
    @Autowired protected JwtService jwtService;
    @Autowired protected UserRepository users;
    @Autowired protected PasswordEncoder encoder;

    protected String bearer() {
        String email = "tester@test.com";
        if (!users.existsByEmail(email)) {
            User u = new User();
            u.setName("Tester"); u.setEmail(email);
            u.setPasswordHash(encoder.encode("secret123"));
            users.save(u);
        }
        return "Bearer " + jwtService.generateToken(email);
    }
}
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd backend && ./mvnw -q test -Dtest=ProfessionIT`
Expected: FAIL (404 on /api/professions).

- [ ] **Step 4: Write Profession entity, repository, DTOs**

```java
// Profession.java
package com.interviewai.profession;

import jakarta.persistence.*;

@Entity
@Table(name = "professions")
public class Profession {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String slug;
    private String name;
    private String description;

    public Long getId() { return id; }
    public String getSlug() { return slug; }
    public String getName() { return name; }
    public String getDescription() { return description; }
}
```

```java
// ProfessionRepository.java
package com.interviewai.profession;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface ProfessionRepository extends JpaRepository<Profession, Long> {
    Optional<Profession> findBySlug(String slug);
}
```

```java
// dto/ProfessionDto.java
package com.interviewai.profession.dto;
import com.interviewai.profession.Profession;
public record ProfessionDto(Long id, String slug, String name, String description) {
    public static ProfessionDto from(Profession p) {
        return new ProfessionDto(p.getId(), p.getSlug(), p.getName(), p.getDescription());
    }
}
```

```java
// dto/OptionsDto.java
package com.interviewai.profession.dto;
import java.util.List;
public record OptionsDto(List<String> levels, List<String> types, List<String> dimensions) {}
```

- [ ] **Step 5: Write CurrentUser helper**

```java
// auth/CurrentUser.java
package com.interviewai.auth;

import com.interviewai.common.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class CurrentUser {
    private final UserRepository users;
    public CurrentUser(UserRepository users) { this.users = users; }

    public User require() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null)
            throw new ApiException(HttpStatus.UNAUTHORIZED, "No autenticado");
        return users.findByEmail(auth.getName())
            .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Usuario no encontrado"));
    }
}
```

- [ ] **Step 6: Write ProfessionController**

```java
// ProfessionController.java
package com.interviewai.profession;

import com.interviewai.common.*;
import com.interviewai.profession.dto.*;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/api/professions")
public class ProfessionController {
    private final ProfessionRepository professions;
    public ProfessionController(ProfessionRepository professions) { this.professions = professions; }

    @GetMapping
    public List<ProfessionDto> list() {
        return professions.findAll().stream().map(ProfessionDto::from).toList();
    }

    @GetMapping("/options")
    public OptionsDto options() {
        return new OptionsDto(
            Arrays.stream(Level.values()).map(Enum::name).toList(),
            Arrays.stream(InterviewType.values()).map(Enum::name).toList(),
            Arrays.stream(Dimension.values()).map(Enum::name).toList());
    }
}
```

- [ ] **Step 7: Run test to verify it passes**

Run: `cd backend && ./mvnw -q test -Dtest=ProfessionIT`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add backend/src
git commit -m "feat(backend): profession endpoints and current-user helper"
```

---

## Task 6: Question entity + QuestionProvider seam

**Files:**
- Create: `backend/src/main/java/com/interviewai/question/Question.java`
- Create: `backend/src/main/java/com/interviewai/question/QuestionRepository.java`
- Create: `backend/src/main/java/com/interviewai/question/QuestionProvider.java`
- Create: `backend/src/main/java/com/interviewai/question/BankQuestionProvider.java`
- Create: `backend/src/test/java/com/interviewai/question/BankQuestionProviderIT.java`

**Interfaces:**
- Consumes: `Level`, `InterviewType`, `Profession`.
- Produces: `Question` entity with getters `getId, getText, getLevel (String), getType (String), getExpectedKeywords (List<String>), getModelAnswer, getTargetDimensions (Map<String,Double>)`. `interface QuestionProvider { List<Question> selectQuestions(Long professionId, Level level, InterviewType type, String language, int limit); }`. `BankQuestionProvider` implements it. `QuestionRepository.findByProfessionIdAndLanguage(Long, String)`.

- [ ] **Step 1: Write the failing test**

```java
// backend/src/test/java/com/interviewai/question/BankQuestionProviderIT.java
package com.interviewai.question;

import com.interviewai.common.InterviewType;
import com.interviewai.common.Level;
import com.interviewai.profession.*;
import com.interviewai.support.PostgresIT;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;
import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class BankQuestionProviderIT extends PostgresIT {

    @Autowired QuestionProvider provider;
    @Autowired ProfessionRepository professions;

    @Test
    void selectsQuestionsForProfession() {
        Long pid = professions.findBySlug("software-development").orElseThrow().getId();
        List<Question> qs = provider.selectQuestions(pid, Level.JUNIOR, InterviewType.MIXED, "es", 5);
        assertThat(qs).isNotEmpty();
        assertThat(qs.size()).isLessThanOrEqualTo(5);
        assertThat(qs.get(0).getExpectedKeywords()).isNotNull();
    }

    @Test
    void mixedTypePullsAcrossTypes() {
        Long pid = professions.findBySlug("software-development").orElseThrow().getId();
        List<Question> qs = provider.selectQuestions(pid, Level.JUNIOR, InterviewType.MIXED, "es", 10);
        long distinctTypes = qs.stream().map(Question::getType).distinct().count();
        assertThat(distinctTypes).isGreaterThan(1);
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && ./mvnw -q test -Dtest=BankQuestionProviderIT`
Expected: FAIL (no QuestionProvider bean / no Question class).

- [ ] **Step 3: Write Question entity + repository**

```java
// Question.java
package com.interviewai.question;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.List;
import java.util.Map;

@Entity
@Table(name = "questions")
public class Question {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "profession_id")
    private Long professionId;
    private String level;
    private String type;
    private String language;
    @Column(columnDefinition = "text")
    private String text;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "expected_keywords")
    private List<String> expectedKeywords;

    @Column(name = "model_answer", columnDefinition = "text")
    private String modelAnswer;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "target_dimensions")
    private Map<String, Double> targetDimensions;

    public Long getId() { return id; }
    public Long getProfessionId() { return professionId; }
    public String getLevel() { return level; }
    public String getType() { return type; }
    public String getLanguage() { return language; }
    public String getText() { return text; }
    public List<String> getExpectedKeywords() { return expectedKeywords; }
    public String getModelAnswer() { return modelAnswer; }
    public Map<String, Double> getTargetDimensions() { return targetDimensions; }
}
```

Note: `@JdbcTypeCode(SqlTypes.JSON)` is built into Hibernate 6 (Spring Boot 3.3) — no extra dependency needed.

```java
// QuestionRepository.java
package com.interviewai.question;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface QuestionRepository extends JpaRepository<Question, Long> {
    List<Question> findByProfessionIdAndLanguage(Long professionId, String language);
}
```

- [ ] **Step 4: Write QuestionProvider seam + BankQuestionProvider**

```java
// QuestionProvider.java
package com.interviewai.question;

import com.interviewai.common.InterviewType;
import com.interviewai.common.Level;
import java.util.List;

/** Seam: an LLM-backed provider can replace this without touching orchestration. */
public interface QuestionProvider {
    List<Question> selectQuestions(Long professionId, Level level, InterviewType type, String language, int limit);
}
```

```java
// BankQuestionProvider.java
package com.interviewai.question;

import com.interviewai.common.InterviewType;
import com.interviewai.common.Level;
import org.springframework.stereotype.Component;

import java.util.Comparator;
import java.util.List;

@Component
public class BankQuestionProvider implements QuestionProvider {
    private final QuestionRepository questions;
    public BankQuestionProvider(QuestionRepository questions) { this.questions = questions; }

    @Override
    public List<Question> selectQuestions(Long professionId, Level level, InterviewType type,
                                          String language, int limit) {
        List<Question> pool = questions.findByProfessionIdAndLanguage(professionId, language);
        // MIXED keeps all types; a specific type filters to it (falls back to all if empty).
        List<Question> filtered = type == InterviewType.MIXED ? pool
            : pool.stream().filter(q -> q.getType().equals(type.name())).toList();
        if (filtered.isEmpty()) filtered = pool;
        // Prefer questions matching the requested level, then fill with the rest.
        return filtered.stream()
            .sorted(Comparator.comparingInt(q -> q.getLevel().equals(level.name()) ? 0 : 1))
            .limit(limit)
            .toList();
    }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd backend && ./mvnw -q test -Dtest=BankQuestionProviderIT`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add backend/src
git commit -m "feat(backend): Question entity and QuestionProvider seam (bank impl)"
```

---

## Task 7: Rule-based scoring engine (AnswerEvaluator seam)

**Files:**
- Create: `backend/src/main/java/com/interviewai/interview/AnswerEvaluator.java`
- Create: `backend/src/main/java/com/interviewai/interview/RuleBasedEvaluator.java`
- Create: `backend/src/test/java/com/interviewai/interview/RuleBasedEvaluatorTest.java`

**Interfaces:**
- Consumes: `Question` (getExpectedKeywords, getTargetDimensions), `Dimension`.
- Produces: `record AnswerSignal(String answerText, long responseTimeMs, int selfConfidence, long expectedTimeMs)`; `interface AnswerEvaluator { Map<Dimension,Integer> evaluate(Question q, AnswerSignal s); }`; `RuleBasedEvaluator` implements it returning a score 0–100 per dimension named in the question's `target_dimensions`.

- [ ] **Step 1: Write the failing test**

```java
// backend/src/test/java/com/interviewai/interview/RuleBasedEvaluatorTest.java
package com.interviewai.interview;

import com.interviewai.common.Dimension;
import com.interviewai.question.Question;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class RuleBasedEvaluatorTest {

    private Question question(List<String> keywords, Map<String, Double> dims) {
        Question q = Mockito.mock(Question.class);
        Mockito.when(q.getExpectedKeywords()).thenReturn(keywords);
        Mockito.when(q.getTargetDimensions()).thenReturn(dims);
        return q;
    }

    @Test
    void strongAnswerScoresHigherThanWeakAnswer() {
        var evaluator = new RuleBasedEvaluator();
        Question q = question(List.of("memoria", "índice", "complejidad"),
            Map.of("DOMAIN_KNOWLEDGE", 0.6, "CLARITY", 0.4));

        var strong = new AnswerSignal(
            "El arreglo usa memoria contigua con acceso por índice O(1); la complejidad cambia según la estructura. "
          + "Explico memoria, índice y complejidad en detalle con ejemplos.",
            30_000, 5, 60_000);
        var weak = new AnswerSignal("No sé.", 2_000, 1, 60_000);

        Map<Dimension, Integer> strongScores = evaluator.evaluate(q, strong);
        Map<Dimension, Integer> weakScores = evaluator.evaluate(q, weak);

        assertThat(strongScores.get(Dimension.DOMAIN_KNOWLEDGE))
            .isGreaterThan(weakScores.get(Dimension.DOMAIN_KNOWLEDGE));
        assertThat(strongScores.get(Dimension.DOMAIN_KNOWLEDGE)).isBetween(0, 100);
    }

    @Test
    void onlyScoresTargetDimensions() {
        var evaluator = new RuleBasedEvaluator();
        Question q = question(List.of("x"), Map.of("LEADERSHIP", 1.0));
        var s = new AnswerSignal("una respuesta con x incluida y desarrollo razonable aquí", 20_000, 3, 60_000);
        assertThat(evaluator.evaluate(q, s)).containsOnlyKeys(Dimension.LEADERSHIP);
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && ./mvnw -q test -Dtest=RuleBasedEvaluatorTest`
Expected: FAIL (no AnswerEvaluator / AnswerSignal / RuleBasedEvaluator).

- [ ] **Step 3: Write the seam + signal record**

```java
// AnswerEvaluator.java
package com.interviewai.interview;

import com.interviewai.common.Dimension;
import com.interviewai.question.Question;
import java.util.Map;

/** Seam: an LLM-backed evaluator can replace this without touching orchestration. */
public interface AnswerEvaluator {
    Map<Dimension, Integer> evaluate(Question question, AnswerSignal signal);
}
```

```java
// AnswerSignal.java
package com.interviewai.interview;

public record AnswerSignal(String answerText, long responseTimeMs, int selfConfidence, long expectedTimeMs) {}
```

- [ ] **Step 4: Write RuleBasedEvaluator**

```java
// RuleBasedEvaluator.java
package com.interviewai.interview;

import com.interviewai.common.Dimension;
import com.interviewai.question.Question;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Component
public class RuleBasedEvaluator implements AnswerEvaluator {

    @Override
    public Map<Dimension, Integer> evaluate(Question question, AnswerSignal s) {
        double length = lengthScore(s.answerText());
        double keywords = keywordScore(s.answerText(), question.getExpectedKeywords());
        double timing = timingScore(s.responseTimeMs(), s.expectedTimeMs());
        double confidence = (s.selfConfidence() - 1) / 4.0; // 1..5 -> 0..1

        // Base composite of objective signals; self-confidence nudges it.
        double base = 0.40 * keywords + 0.30 * length + 0.20 * timing + 0.10 * confidence;

        Map<Dimension, Integer> result = new HashMap<>();
        Map<String, Double> targets = question.getTargetDimensions();
        if (targets == null) return result;
        for (var entry : targets.entrySet()) {
            Dimension dim = Dimension.valueOf(entry.getKey());
            double weighted = base * weightBoost(entry.getValue());
            result.put(dim, clampTo100(weighted));
        }
        return result;
    }

    private double lengthScore(String text) {
        int words = text == null ? 0 : text.trim().isEmpty() ? 0 : text.trim().split("\\s+").length;
        if (words <= 3) return 0.1;
        if (words >= 40) return 1.0;
        return 0.1 + 0.9 * ((words - 3) / 37.0);
    }

    private double keywordScore(String text, List<String> keywords) {
        if (keywords == null || keywords.isEmpty()) return 0.6; // neutral when none defined
        String lower = text == null ? "" : text.toLowerCase(Locale.ROOT);
        long hits = keywords.stream().filter(k -> lower.contains(k.toLowerCase(Locale.ROOT))).count();
        return (double) hits / keywords.size();
    }

    private double timingScore(long actualMs, long expectedMs) {
        if (expectedMs <= 0) return 0.6;
        double ratio = (double) actualMs / expectedMs;
        if (ratio < 0.1) return 0.3;      // suspiciously fast
        if (ratio <= 1.2) return 1.0;     // within band
        if (ratio <= 2.0) return 0.6;
        return 0.4;                        // very slow
    }

    private double weightBoost(double weight) {
        // Heavier target dimensions are judged a touch more strictly is undesirable;
        // keep neutral — weight only chooses which dimensions, not their leniency.
        return 1.0;
    }

    private int clampTo100(double v) {
        return (int) Math.round(Math.max(0, Math.min(1, v)) * 100);
    }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd backend && ./mvnw -q test -Dtest=RuleBasedEvaluatorTest`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add backend/src
git commit -m "feat(backend): rule-based AnswerEvaluator seam and implementation"
```

---

## Task 8: Feedback generator

**Files:**
- Create: `backend/src/main/java/com/interviewai/interview/FeedbackGenerator.java`
- Create: `backend/src/main/java/com/interviewai/interview/FeedbackResult.java`
- Create: `backend/src/test/java/com/interviewai/interview/FeedbackGeneratorTest.java`

**Interfaces:**
- Consumes: `Dimension`.
- Produces: `record FeedbackResult(List<String> strengths, List<String> weaknesses, List<String> recommendations, List<String> improvementPlan)`; `FeedbackGenerator.generate(Map<Dimension,Integer> averages)`.

- [ ] **Step 1: Write the failing test**

```java
// backend/src/test/java/com/interviewai/interview/FeedbackGeneratorTest.java
package com.interviewai.interview;

import com.interviewai.common.Dimension;
import org.junit.jupiter.api.Test;

import java.util.Map;
import static org.assertj.core.api.Assertions.assertThat;

class FeedbackGeneratorTest {

    @Test
    void highDimensionBecomesStrengthLowBecomesWeakness() {
        var gen = new FeedbackGenerator();
        var result = gen.generate(Map.of(
            Dimension.COMMUNICATION, 85,
            Dimension.PROBLEM_SOLVING, 30));

        assertThat(result.strengths()).anyMatch(s -> s.contains("Comunicación"));
        assertThat(result.weaknesses()).anyMatch(w -> w.contains("Resolución de problemas"));
        assertThat(result.recommendations()).isNotEmpty();
        assertThat(result.improvementPlan()).isNotEmpty();
    }

    @Test
    void midDimensionIsNeitherStrengthNorWeakness() {
        var gen = new FeedbackGenerator();
        var result = gen.generate(Map.of(Dimension.CLARITY, 60));
        assertThat(result.strengths()).isEmpty();
        assertThat(result.weaknesses()).isEmpty();
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && ./mvnw -q test -Dtest=FeedbackGeneratorTest`
Expected: FAIL (no FeedbackGenerator).

- [ ] **Step 3: Write FeedbackResult + FeedbackGenerator**

```java
// FeedbackResult.java
package com.interviewai.interview;
import java.util.List;
public record FeedbackResult(List<String> strengths, List<String> weaknesses,
                             List<String> recommendations, List<String> improvementPlan) {}
```

```java
// FeedbackGenerator.java
package com.interviewai.interview;

import com.interviewai.common.Dimension;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
public class FeedbackGenerator {
    private static final int STRENGTH_THRESHOLD = 75;
    private static final int WEAKNESS_THRESHOLD = 50;

    public FeedbackResult generate(Map<Dimension, Integer> averages) {
        List<String> strengths = new ArrayList<>();
        List<String> weaknesses = new ArrayList<>();
        List<String> recommendations = new ArrayList<>();
        List<String> plan = new ArrayList<>();

        averages.forEach((dim, score) -> {
            String label = dim.spanishLabel();
            if (score >= STRENGTH_THRESHOLD) {
                strengths.add(label + ": demostraste un buen nivel (" + score + "/100).");
            } else if (score < WEAKNESS_THRESHOLD) {
                weaknesses.add(label + ": área a reforzar (" + score + "/100).");
                recommendations.add(recommendationFor(dim));
                plan.add(planStepFor(dim));
            }
        });
        if (strengths.isEmpty() && weaknesses.isEmpty()) {
            strengths.add("Desempeño equilibrado en todas las dimensiones evaluadas.");
        }
        return new FeedbackResult(strengths, weaknesses, recommendations, plan);
    }

    private String recommendationFor(Dimension dim) {
        return switch (dim) {
            case COMMUNICATION -> "Practica estructurar tus respuestas con introducción, desarrollo y cierre.";
            case CLARITY -> "Usa ejemplos concretos y evita la jerga innecesaria para ganar claridad.";
            case CONFIDENCE -> "Prepara y ensaya respuestas en voz alta para proyectar más seguridad.";
            case CRITICAL_THINKING -> "Antes de responder, enumera supuestos y alternativas en voz alta.";
            case PROBLEM_SOLVING -> "Aplica un método explícito: entender, planear, resolver, verificar.";
            case DOMAIN_KNOWLEDGE -> "Refuerza los fundamentos del área con estudio dirigido y práctica.";
            case LEADERSHIP -> "Prepara ejemplos STAR de situaciones donde lideraste o influiste.";
            case TEAMWORK -> "Destaca cómo colaboras: roles, comunicación y resolución de conflictos.";
        };
    }

    private String planStepFor(Dimension dim) {
        return "Semana de enfoque en " + dim.spanishLabel().toLowerCase()
             + ": 3 sesiones de práctica deliberada y 1 simulación de seguimiento.";
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && ./mvnw -q test -Dtest=FeedbackGeneratorTest`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src
git commit -m "feat(backend): threshold-based feedback generator"
```

---

## Task 9: Interview orchestration (create, next-question, answer, finish, results, history)

**Files:**
- Create: `backend/src/main/java/com/interviewai/interview/InterviewSession.java`
- Create: `backend/src/main/java/com/interviewai/interview/InterviewAnswer.java`
- Create: `backend/src/main/java/com/interviewai/interview/SessionFeedback.java`
- Create: `backend/src/main/java/com/interviewai/interview/InterviewSessionRepository.java`
- Create: `backend/src/main/java/com/interviewai/interview/InterviewAnswerRepository.java`
- Create: `backend/src/main/java/com/interviewai/interview/SessionFeedbackRepository.java`
- Create: `backend/src/main/java/com/interviewai/interview/dto/*` (CreateInterviewRequest, QuestionDto, SubmitAnswerRequest, ResultsDto, SessionSummaryDto, NextQuestionDto)
- Create: `backend/src/main/java/com/interviewai/interview/InterviewService.java`
- Create: `backend/src/main/java/com/interviewai/interview/InterviewController.java`
- Create: `backend/src/test/java/com/interviewai/interview/InterviewFlowIT.java`

**Interfaces:**
- Consumes: `QuestionProvider.selectQuestions`, `AnswerEvaluator.evaluate`, `FeedbackGenerator.generate`, `CurrentUser.require`, `ProfessionRepository`, `QuestionRepository`.
- Produces: REST endpoints listed in the spec.

- [ ] **Step 1: Write the failing end-to-end test**

```java
// backend/src/test/java/com/interviewai/interview/InterviewFlowIT.java
package com.interviewai.interview;

import com.interviewai.support.AuthenticatedIT;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.assertj.core.api.Assertions.assertThat;

class InterviewFlowIT extends AuthenticatedIT {

    @Autowired ObjectMapper mapper;

    @Test
    void fullInterviewLifecycle() throws Exception {
        String auth = bearer();

        // create
        String createBody = """
            {"professionSlug":"software-development","roleTitle":"Backend Dev",
             "targetCompany":"Acme","industry":"Tech","level":"JUNIOR","type":"MIXED",
             "language":"es","durationMinutes":15}""";
        String createResp = mockMvc.perform(post("/api/interviews")
                .header("Authorization", auth).contentType(MediaType.APPLICATION_JSON).content(createBody))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").isNumber())
            .andReturn().getResponse().getContentAsString();
        long sessionId = mapper.readTree(createResp).get("id").asLong();

        // answer every question until none remain
        int guard = 0;
        while (guard++ < 50) {
            String nextResp = mockMvc.perform(get("/api/interviews/" + sessionId + "/next-question")
                    .header("Authorization", auth))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
            JsonNode next = mapper.readTree(nextResp);
            if (next.get("question").isNull()) break;
            long qid = next.get("question").get("id").asLong();
            String answerBody = """
                {"questionId":%d,"answerText":"Una respuesta detallada con memoria, índice y complejidad bien explicada.","responseTimeMs":25000,"selfConfidence":4}"""
                .formatted(qid);
            mockMvc.perform(post("/api/interviews/" + sessionId + "/answers")
                    .header("Authorization", auth).contentType(MediaType.APPLICATION_JSON).content(answerBody))
                .andExpect(status().isOk());
        }

        // finish
        mockMvc.perform(post("/api/interviews/" + sessionId + "/finish").header("Authorization", auth))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.overallScore").isNumber());

        // results
        String results = mockMvc.perform(get("/api/interviews/" + sessionId + "/results")
                .header("Authorization", auth))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.dimensionScores").exists())
            .andExpect(jsonPath("$.feedback.strengths").isArray())
            .andReturn().getResponse().getContentAsString();
        assertThat(mapper.readTree(results).get("answers")).isNotEmpty();

        // history
        mockMvc.perform(get("/api/interviews").header("Authorization", auth))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").isNumber());
    }

    @Test
    void cannotAccessAnotherUsersSession() throws Exception {
        // create as default tester
        String auth = bearer();
        String createBody = """
            {"professionSlug":"software-development","roleTitle":"R","level":"JUNIOR",
             "type":"MIXED","language":"es","durationMinutes":15}""";
        String createResp = mockMvc.perform(post("/api/interviews")
                .header("Authorization", auth).contentType(MediaType.APPLICATION_JSON).content(createBody))
            .andReturn().getResponse().getContentAsString();
        long sessionId = mapper.readTree(createResp).get("id").asLong();

        // a different user
        String otherToken = "Bearer " + jwtService.generateToken("intruder@test.com");
        // ensure user exists
        if (!users.existsByEmail("intruder@test.com")) {
            var u = new com.interviewai.auth.User();
            u.setName("Intruder"); u.setEmail("intruder@test.com");
            u.setPasswordHash(encoder.encode("secret123")); users.save(u);
        }
        mockMvc.perform(get("/api/interviews/" + sessionId + "/results").header("Authorization", otherToken))
            .andExpect(status().isNotFound());
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && ./mvnw -q test -Dtest=InterviewFlowIT`
Expected: FAIL (no /api/interviews endpoints).

- [ ] **Step 3: Write entities**

```java
// InterviewSession.java
package com.interviewai.interview;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "interview_sessions")
public class InterviewSession {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "user_id") private Long userId;
    @Column(name = "profession_id") private Long professionId;
    @Column(name = "role_title") private String roleTitle;
    @Column(name = "target_company") private String targetCompany;
    private String industry;
    private String level;
    private String type;
    private String language;
    @Column(name = "duration_minutes") private int durationMinutes;
    private String status;
    @Column(name = "overall_score") private Integer overallScore;
    @Column(name = "started_at") private OffsetDateTime startedAt = OffsetDateTime.now();
    @Column(name = "finished_at") private OffsetDateTime finishedAt;

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long v) { this.userId = v; }
    public Long getProfessionId() { return professionId; }
    public void setProfessionId(Long v) { this.professionId = v; }
    public String getRoleTitle() { return roleTitle; }
    public void setRoleTitle(String v) { this.roleTitle = v; }
    public String getTargetCompany() { return targetCompany; }
    public void setTargetCompany(String v) { this.targetCompany = v; }
    public String getIndustry() { return industry; }
    public void setIndustry(String v) { this.industry = v; }
    public String getLevel() { return level; }
    public void setLevel(String v) { this.level = v; }
    public String getType() { return type; }
    public void setType(String v) { this.type = v; }
    public String getLanguage() { return language; }
    public void setLanguage(String v) { this.language = v; }
    public int getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(int v) { this.durationMinutes = v; }
    public String getStatus() { return status; }
    public void setStatus(String v) { this.status = v; }
    public Integer getOverallScore() { return overallScore; }
    public void setOverallScore(Integer v) { this.overallScore = v; }
    public OffsetDateTime getStartedAt() { return startedAt; }
    public void setFinishedAt(OffsetDateTime v) { this.finishedAt = v; }
}
```

```java
// InterviewAnswer.java
package com.interviewai.interview;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.util.Map;

@Entity
@Table(name = "interview_answers")
public class InterviewAnswer {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "session_id") private Long sessionId;
    @Column(name = "question_id") private Long questionId;
    @Column(name = "answer_text", columnDefinition = "text") private String answerText;
    @Column(name = "response_time_ms") private long responseTimeMs;
    @Column(name = "self_confidence") private int selfConfidence;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "dimension_scores")
    private Map<String, Integer> dimensionScores;

    public Long getId() { return id; }
    public Long getSessionId() { return sessionId; }
    public void setSessionId(Long v) { this.sessionId = v; }
    public Long getQuestionId() { return questionId; }
    public void setQuestionId(Long v) { this.questionId = v; }
    public String getAnswerText() { return answerText; }
    public void setAnswerText(String v) { this.answerText = v; }
    public long getResponseTimeMs() { return responseTimeMs; }
    public void setResponseTimeMs(long v) { this.responseTimeMs = v; }
    public int getSelfConfidence() { return selfConfidence; }
    public void setSelfConfidence(int v) { this.selfConfidence = v; }
    public Map<String, Integer> getDimensionScores() { return dimensionScores; }
    public void setDimensionScores(Map<String, Integer> v) { this.dimensionScores = v; }
}
```

```java
// SessionFeedback.java
package com.interviewai.interview;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.util.List;

@Entity
@Table(name = "session_feedback")
public class SessionFeedback {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "session_id") private Long sessionId;
    @JdbcTypeCode(SqlTypes.JSON) private List<String> strengths;
    @JdbcTypeCode(SqlTypes.JSON) private List<String> weaknesses;
    @JdbcTypeCode(SqlTypes.JSON) private List<String> recommendations;
    @JdbcTypeCode(SqlTypes.JSON) @Column(name = "improvement_plan") private List<String> improvementPlan;

    public Long getSessionId() { return sessionId; }
    public void setSessionId(Long v) { this.sessionId = v; }
    public List<String> getStrengths() { return strengths; }
    public void setStrengths(List<String> v) { this.strengths = v; }
    public List<String> getWeaknesses() { return weaknesses; }
    public void setWeaknesses(List<String> v) { this.weaknesses = v; }
    public List<String> getRecommendations() { return recommendations; }
    public void setRecommendations(List<String> v) { this.recommendations = v; }
    public List<String> getImprovementPlan() { return improvementPlan; }
    public void setImprovementPlan(List<String> v) { this.improvementPlan = v; }
}
```

- [ ] **Step 4: Write repositories**

```java
// InterviewSessionRepository.java
package com.interviewai.interview;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface InterviewSessionRepository extends JpaRepository<InterviewSession, Long> {
    List<InterviewSession> findByUserIdOrderByStartedAtDesc(Long userId);
}
```

```java
// InterviewAnswerRepository.java
package com.interviewai.interview;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface InterviewAnswerRepository extends JpaRepository<InterviewAnswer, Long> {
    List<InterviewAnswer> findBySessionId(Long sessionId);
    boolean existsBySessionIdAndQuestionId(Long sessionId, Long questionId);
    long countBySessionId(Long sessionId);
}
```

```java
// SessionFeedbackRepository.java
package com.interviewai.interview;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface SessionFeedbackRepository extends JpaRepository<SessionFeedback, Long> {
    Optional<SessionFeedback> findBySessionId(Long sessionId);
}
```

- [ ] **Step 5: Write DTOs**

```java
// dto/CreateInterviewRequest.java
package com.interviewai.interview.dto;
import jakarta.validation.constraints.*;
public record CreateInterviewRequest(
    @NotBlank String professionSlug,
    @NotBlank String roleTitle,
    String targetCompany,
    String industry,
    @NotBlank String level,
    @NotBlank String type,
    @NotBlank String language,
    @Min(5) @Max(120) int durationMinutes) {}
```

```java
// dto/QuestionDto.java
package com.interviewai.interview.dto;
import com.interviewai.question.Question;
public record QuestionDto(Long id, String text, String type, int index, int total) {
    public static QuestionDto of(Question q, int index, int total) {
        return new QuestionDto(q.getId(), q.getText(), q.getType(), index, total);
    }
}
```

```java
// dto/NextQuestionDto.java
package com.interviewai.interview.dto;
public record NextQuestionDto(QuestionDto question, boolean finished) {}
```

```java
// dto/SubmitAnswerRequest.java
package com.interviewai.interview.dto;
import jakarta.validation.constraints.*;
public record SubmitAnswerRequest(
    @NotNull Long questionId,
    @NotBlank String answerText,
    @PositiveOrZero long responseTimeMs,
    @Min(1) @Max(5) int selfConfidence) {}
```

```java
// dto/ResultsDto.java
package com.interviewai.interview.dto;
import java.util.List;
import java.util.Map;
public record ResultsDto(
    Long sessionId, String roleTitle, String level, String type,
    Integer overallScore, Map<String, Integer> dimensionScores,
    FeedbackDto feedback, List<AnswerReviewDto> answers) {

    public record FeedbackDto(List<String> strengths, List<String> weaknesses,
                              List<String> recommendations, List<String> improvementPlan) {}
    public record AnswerReviewDto(Long questionId, String questionText, String answerText,
                                  String modelAnswer, Map<String, Integer> dimensionScores) {}
}
```

```java
// dto/SessionSummaryDto.java
package com.interviewai.interview.dto;
import com.interviewai.interview.InterviewSession;
public record SessionSummaryDto(Long id, String roleTitle, String level, String type,
                                String status, Integer overallScore, String startedAt) {
    public static SessionSummaryDto from(InterviewSession s) {
        return new SessionSummaryDto(s.getId(), s.getRoleTitle(), s.getLevel(), s.getType(),
            s.getStatus(), s.getOverallScore(), s.getStartedAt().toString());
    }
}
```

- [ ] **Step 6: Write InterviewService**

```java
// InterviewService.java
package com.interviewai.interview;

import com.interviewai.auth.CurrentUser;
import com.interviewai.auth.User;
import com.interviewai.common.*;
import com.interviewai.interview.dto.*;
import com.interviewai.profession.*;
import com.interviewai.question.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.*;

@Service
public class InterviewService {
    private static final int MAX_QUESTIONS = 8;

    private final InterviewSessionRepository sessions;
    private final InterviewAnswerRepository answers;
    private final SessionFeedbackRepository feedbacks;
    private final ProfessionRepository professions;
    private final QuestionRepository questions;
    private final QuestionProvider questionProvider;
    private final AnswerEvaluator evaluator;
    private final FeedbackGenerator feedbackGenerator;
    private final CurrentUser currentUser;

    public InterviewService(InterviewSessionRepository sessions, InterviewAnswerRepository answers,
                            SessionFeedbackRepository feedbacks, ProfessionRepository professions,
                            QuestionRepository questions, QuestionProvider questionProvider,
                            AnswerEvaluator evaluator, FeedbackGenerator feedbackGenerator,
                            CurrentUser currentUser) {
        this.sessions = sessions; this.answers = answers; this.feedbacks = feedbacks;
        this.professions = professions; this.questions = questions;
        this.questionProvider = questionProvider; this.evaluator = evaluator;
        this.feedbackGenerator = feedbackGenerator; this.currentUser = currentUser;
    }

    @Transactional
    public SessionSummaryDto create(CreateInterviewRequest req) {
        User user = currentUser.require();
        Profession profession = professions.findBySlug(req.professionSlug())
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Profesión no encontrada"));
        InterviewSession s = new InterviewSession();
        s.setUserId(user.getId());
        s.setProfessionId(profession.getId());
        s.setRoleTitle(req.roleTitle());
        s.setTargetCompany(req.targetCompany());
        s.setIndustry(req.industry());
        s.setLevel(Level.valueOf(req.level()).name());
        s.setType(InterviewType.valueOf(req.type()).name());
        s.setLanguage(req.language());
        s.setDurationMinutes(req.durationMinutes());
        s.setStatus("IN_PROGRESS");
        sessions.save(s);
        return SessionSummaryDto.from(s);
    }

    @Transactional(readOnly = true)
    public NextQuestionDto nextQuestion(Long sessionId) {
        InterviewSession s = ownedSession(sessionId);
        List<Question> selected = selectedQuestions(s);
        long answered = answers.countBySessionId(sessionId);
        for (Question q : selected) {
            if (!answers.existsBySessionIdAndQuestionId(sessionId, q.getId())) {
                return new NextQuestionDto(
                    QuestionDto.of(q, (int) answered + 1, selected.size()), false);
            }
        }
        return new NextQuestionDto(null, true);
    }

    @Transactional
    public void submitAnswer(Long sessionId, SubmitAnswerRequest req) {
        InterviewSession s = ownedSession(sessionId);
        if (answers.existsBySessionIdAndQuestionId(sessionId, req.questionId()))
            throw new ApiException(HttpStatus.CONFLICT, "La pregunta ya fue respondida");
        Question q = questions.findById(req.questionId())
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Pregunta no encontrada"));

        long expectedMs = (long) s.getDurationMinutes() * 60_000 / MAX_QUESTIONS;
        var signal = new AnswerSignal(req.answerText(), req.responseTimeMs(), req.selfConfidence(), expectedMs);
        Map<Dimension, Integer> scores = evaluator.evaluate(q, signal);

        InterviewAnswer a = new InterviewAnswer();
        a.setSessionId(sessionId);
        a.setQuestionId(q.getId());
        a.setAnswerText(req.answerText());
        a.setResponseTimeMs(req.responseTimeMs());
        a.setSelfConfidence(req.selfConfidence());
        Map<String, Integer> asString = new HashMap<>();
        scores.forEach((k, v) -> asString.put(k.name(), v));
        a.setDimensionScores(asString);
        answers.save(a);
    }

    @Transactional
    public SessionSummaryDto finish(Long sessionId) {
        InterviewSession s = ownedSession(sessionId);
        Map<Dimension, Integer> averages = averageDimensions(answers.findBySessionId(sessionId));
        int overall = averages.isEmpty() ? 0
            : (int) Math.round(averages.values().stream().mapToInt(Integer::intValue).average().orElse(0));

        FeedbackResult fr = feedbackGenerator.generate(averages);
        SessionFeedback fb = feedbacks.findBySessionId(sessionId).orElseGet(SessionFeedback::new);
        fb.setSessionId(sessionId);
        fb.setStrengths(fr.strengths());
        fb.setWeaknesses(fr.weaknesses());
        fb.setRecommendations(fr.recommendations());
        fb.setImprovementPlan(fr.improvementPlan());
        feedbacks.save(fb);

        s.setOverallScore(overall);
        s.setStatus("FINISHED");
        s.setFinishedAt(OffsetDateTime.now());
        sessions.save(s);
        return SessionSummaryDto.from(s);
    }

    @Transactional(readOnly = true)
    public ResultsDto results(Long sessionId) {
        InterviewSession s = ownedSession(sessionId);
        List<InterviewAnswer> sessionAnswers = answers.findBySessionId(sessionId);
        Map<Dimension, Integer> averages = averageDimensions(sessionAnswers);
        Map<String, Integer> dimScores = new LinkedHashMap<>();
        for (Dimension d : Dimension.values()) {
            if (averages.containsKey(d)) dimScores.put(d.name(), averages.get(d));
        }
        SessionFeedback fb = feedbacks.findBySessionId(sessionId).orElseGet(SessionFeedback::new);
        var feedbackDto = new ResultsDto.FeedbackDto(
            orEmpty(fb.getStrengths()), orEmpty(fb.getWeaknesses()),
            orEmpty(fb.getRecommendations()), orEmpty(fb.getImprovementPlan()));

        List<ResultsDto.AnswerReviewDto> reviews = sessionAnswers.stream().map(a -> {
            Question q = questions.findById(a.getQuestionId()).orElse(null);
            return new ResultsDto.AnswerReviewDto(
                a.getQuestionId(),
                q == null ? "" : q.getText(),
                a.getAnswerText(),
                q == null ? "" : q.getModelAnswer(),
                a.getDimensionScores());
        }).toList();

        return new ResultsDto(s.getId(), s.getRoleTitle(), s.getLevel(), s.getType(),
            s.getOverallScore(), dimScores, feedbackDto, reviews);
    }

    @Transactional(readOnly = true)
    public List<SessionSummaryDto> history() {
        User user = currentUser.require();
        return sessions.findByUserIdOrderByStartedAtDesc(user.getId())
            .stream().map(SessionSummaryDto::from).toList();
    }

    private InterviewSession ownedSession(Long sessionId) {
        User user = currentUser.require();
        InterviewSession s = sessions.findById(sessionId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Sesión no encontrada"));
        if (!s.getUserId().equals(user.getId()))
            throw new ApiException(HttpStatus.NOT_FOUND, "Sesión no encontrada");
        return s;
    }

    private List<Question> selectedQuestions(InterviewSession s) {
        return questionProvider.selectQuestions(s.getProfessionId(),
            Level.valueOf(s.getLevel()), InterviewType.valueOf(s.getType()),
            s.getLanguage(), MAX_QUESTIONS);
    }

    private Map<Dimension, Integer> averageDimensions(List<InterviewAnswer> list) {
        Map<Dimension, List<Integer>> acc = new EnumMap<>(Dimension.class);
        for (InterviewAnswer a : list) {
            if (a.getDimensionScores() == null) continue;
            a.getDimensionScores().forEach((k, v) ->
                acc.computeIfAbsent(Dimension.valueOf(k), x -> new ArrayList<>()).add(v));
        }
        Map<Dimension, Integer> averages = new EnumMap<>(Dimension.class);
        acc.forEach((dim, vals) ->
            averages.put(dim, (int) Math.round(vals.stream().mapToInt(Integer::intValue).average().orElse(0))));
        return averages;
    }

    private List<String> orEmpty(List<String> v) { return v == null ? List.of() : v; }
}
```

- [ ] **Step 7: Write InterviewController**

```java
// InterviewController.java
package com.interviewai.interview;

import com.interviewai.interview.dto.*;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/interviews")
@SecurityRequirement(name = "bearerAuth")
public class InterviewController {
    private final InterviewService service;
    public InterviewController(InterviewService service) { this.service = service; }

    @PostMapping
    public SessionSummaryDto create(@Valid @RequestBody CreateInterviewRequest req) {
        return service.create(req);
    }

    @GetMapping("/{id}/next-question")
    public NextQuestionDto next(@PathVariable Long id) { return service.nextQuestion(id); }

    @PostMapping("/{id}/answers")
    public void answer(@PathVariable Long id, @Valid @RequestBody SubmitAnswerRequest req) {
        service.submitAnswer(id, req);
    }

    @PostMapping("/{id}/finish")
    public SessionSummaryDto finish(@PathVariable Long id) { return service.finish(id); }

    @GetMapping("/{id}/results")
    public ResultsDto results(@PathVariable Long id) { return service.results(id); }

    @GetMapping
    public List<SessionSummaryDto> history() { return service.history(); }
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `cd backend && ./mvnw -q test -Dtest=InterviewFlowIT`
Expected: PASS.

- [ ] **Step 9: Run the whole suite**

Run: `cd backend && ./mvnw -q test`
Expected: PASS (all ITs and unit tests green).

- [ ] **Step 10: Commit**

```bash
git add backend/src
git commit -m "feat(backend): interview orchestration endpoints (create/answer/finish/results/history)"
```

---

## Manual verification (after Task 9)

1. Start Postgres: `docker run -d --name interviewai-db -e POSTGRES_DB=interviewai -e POSTGRES_USER=interviewai -e POSTGRES_PASSWORD=interviewai -p 5432:5432 postgres:16-alpine`
2. `cd backend && ./mvnw spring-boot:run`
3. Open `http://localhost:8080/swagger-ui.html` — register, copy the JWT, authorize, then walk create → next-question → answers → finish → results.

---

## Self-Review notes

- **Spec coverage:** auth (Task 4), data-driven professions/questions (Tasks 2,5,6), 8 dimensions (Task 3), config wizard fields (CreateInterviewRequest, Task 9), rule-based scoring with length/keywords/timing/self-confidence (Task 7), feedback strengths/weaknesses/recommendations/plan (Task 8), interview flow endpoints + history (Task 9), Swagger (Task 4 OpenApiConfig), LLM seams (Tasks 6,7). PDF/voice/video/gamification explicitly out of MVP scope.
- **Placeholder scan:** the only `_bootstrap` placeholder migration in Task 1 is replaced in Task 2; noted explicitly.
- **Type consistency:** `QuestionProvider.selectQuestions(Long,Level,InterviewType,String,int)`, `AnswerEvaluator.evaluate(Question,AnswerSignal)→Map<Dimension,Integer>`, `FeedbackGenerator.generate(Map<Dimension,Integer>)→FeedbackResult` are used consistently across Tasks 6–9.
