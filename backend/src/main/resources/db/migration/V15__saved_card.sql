-- Display-only saved card (brand + last 4). Never store the full PAN.
ALTER TABLE users
  ADD COLUMN card_brand VARCHAR(40),
  ADD COLUMN card_last4 VARCHAR(4);
