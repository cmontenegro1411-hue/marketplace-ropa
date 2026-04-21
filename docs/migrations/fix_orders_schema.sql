-- Corregir y ampliar la tabla orders para el modelo Marketplace
ALTER TABLE orders ADD COLUMN IF NOT EXISTS mp_payment_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS mp_application_fee NUMERIC(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS mp_escrow_release_date TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS buyer_conformity BOOLEAN DEFAULT FALSE;

-- También habilitar la columna en order_items si fuera necesario para granularidad
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS marketplace_fee NUMERIC(10,2);

-- Índices de búsqueda
CREATE INDEX IF NOT EXISTS idx_orders_mp_payment_id ON orders(mp_payment_id);
