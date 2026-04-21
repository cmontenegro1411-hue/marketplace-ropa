-- Actualización de la tabla users para Mercado Pago Connect
ALTER TABLE users ADD COLUMN IF NOT EXISTS mp_access_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS mp_refresh_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS mp_user_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS mp_public_key TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS mp_token_expires_at TIMESTAMPTZ;

-- Seguimiento de uso de IA en productos para cobro dinámico
ALTER TABLE products ADD COLUMN IF NOT EXISTS ai_usage_type TEXT CHECK (ai_usage_type IN ('free', 'prepaid', 'on_demand')) DEFAULT 'free';

-- Transacciones con Escrow y seguimiento de split
-- Asumiendo que existe una tabla 'pedidos_finales' o similar, crearemos/actualizaremos la tabla de órdenes
-- Si la tabla se llama 'orders', la usamos. Si se llama 'pedidos_finales', la usamos.
-- Grep previo sugería que guardamos en 'pedidos_finales'.

ALTER TABLE pedidos_finales ADD COLUMN IF NOT EXISTS mp_payment_id TEXT;
ALTER TABLE pedidos_finales ADD COLUMN IF NOT EXISTS mp_payment_status TEXT DEFAULT 'pending'; -- pending, authorized, captured, refunded
ALTER TABLE pedidos_finales ADD COLUMN IF NOT EXISTS mp_application_fee NUMERIC(10,2);
ALTER TABLE pedidos_finales ADD COLUMN IF NOT EXISTS mp_escrow_release_date TIMESTAMPTZ;
ALTER TABLE pedidos_finales ADD COLUMN IF NOT EXISTS buyer_conformity BOOLEAN DEFAULT FALSE;

-- Índice para búsqueda de pagos
CREATE INDEX IF NOT EXISTS idx_pedidos_mp_payment_id ON pedidos_finales(mp_payment_id);
