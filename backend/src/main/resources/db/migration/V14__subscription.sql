-- MercadoPago subscription (preapproval) reference + status per user.
ALTER TABLE users
  ADD COLUMN mp_preapproval_id   VARCHAR(80),
  ADD COLUMN subscription_status VARCHAR(30);
