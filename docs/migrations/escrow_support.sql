-- Migración: Soporte Escrow en Products
-- Fecha: 2026-04-18

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS tracking_number TEXT,
ADD COLUMN IF NOT EXISTS conformity_token UUID DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS buyer_conformity BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS ai_on_demand_charge BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS net_payout NUMERIC(10,2);

-- Actualizar order_items para trazabilidad de comisiones
ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS platform_fee NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS ia_cost NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS payout_amount NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending'; -- pending, ready_for_payout, paid
