-- Soporte para flujo de envío y conformidad por email
ALTER TABLE products ADD COLUMN IF NOT EXISTS conformity_token UUID DEFAULT gen_random_uuid();
ALTER TABLE products ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ;
ALTER TABLE products ADD COLUMN IF NOT EXISTS tracking_number TEXT;

-- Índice para búsqueda de tokens de conformidad
CREATE INDEX IF NOT EXISTS idx_products_conformity_token ON products(conformity_token);
