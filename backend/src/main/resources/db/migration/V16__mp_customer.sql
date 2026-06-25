-- MercadoPago customer id (to save the card and reuse it for subscriptions).
ALTER TABLE users ADD COLUMN mp_customer_id VARCHAR(80);
