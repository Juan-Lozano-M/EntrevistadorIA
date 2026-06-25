-- MercadoPago preapproval_plan id: the per-user subscription plan we redirect to.
-- We link the eventual subscription (preapproval) back to the user via this plan id.
ALTER TABLE users ADD COLUMN mp_preapproval_plan_id VARCHAR(80);
