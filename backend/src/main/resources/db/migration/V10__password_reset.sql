-- Single-use password reset token per user, with expiry.
ALTER TABLE users
  ADD COLUMN reset_token         VARCHAR(100),
  ADD COLUMN reset_token_expires TIMESTAMPTZ;
