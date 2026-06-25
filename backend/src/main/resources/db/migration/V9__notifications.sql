-- Per-user notification preferences (moved server-side so the scheduler knows who opted in),
-- the set of achievements already unlocked (to detect newly-unlocked ones), and idempotency
-- markers so a scheduled email isn't sent twice the same day/week.
ALTER TABLE users
  ADD COLUMN notify_daily          BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN notify_weekly         BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN notify_achievements   BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN notify_product        BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN unlocked_achievements JSONB   NOT NULL DEFAULT '[]',
  ADD COLUMN last_daily_email      DATE,
  ADD COLUMN last_weekly_email     DATE;
