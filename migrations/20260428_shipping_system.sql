-- MIGRACIÓN: Sistema de Envío Dinámico (v1.9.0)
-- Fecha: 2026-04-28

-- 1. Extender tabla de usuarios para configurar tarifas de envío y ubicación base
ALTER TABLE users ADD COLUMN IF NOT EXISTS shipping_rates JSONB DEFAULT '{"local": 0, "regional": 15, "national": 20}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ubigeo_code TEXT;

-- 2. Extender tabla de productos para persistir datos de envío al momento de la reserva
ALTER TABLE products ADD COLUMN IF NOT EXISTS shipping_address TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS shipping_ubigeo TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS shipping_cost NUMERIC;

-- 3. Extender tabla de órdenes para registrar el detalle completo de entrega
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_name TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_phone TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_department TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_province TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_district TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_ubigeo TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_fee NUMERIC;

-- COMENTARIO: Estos campos permiten que cada orden guarde una "foto" de la dirección de envío,
-- independientemente de si el usuario cambia su dirección en el perfil después.
