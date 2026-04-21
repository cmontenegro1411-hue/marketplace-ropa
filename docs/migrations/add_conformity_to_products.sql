-- Añadir buyer_conformity a la tabla products para seguimiento granular
ALTER TABLE products ADD COLUMN IF NOT EXISTS buyer_conformity BOOLEAN DEFAULT FALSE;
