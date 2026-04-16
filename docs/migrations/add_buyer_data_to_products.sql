-- Agregando campos para identificar al comprador en la tabla productos (P2P Double Trigger)
ALTER TABLE products ADD COLUMN IF NOT EXISTS buyer_name text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS buyer_phone text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS buyer_email text;
