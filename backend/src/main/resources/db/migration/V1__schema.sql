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
