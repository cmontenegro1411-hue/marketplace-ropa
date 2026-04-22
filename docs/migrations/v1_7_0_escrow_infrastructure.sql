-- Migración: Infraestructura de Escrow y Balances de Usuario
-- Fecha: 2026-04-22
-- Versión: 1.7.0

-- 1. Agregar columnas de balance a la tabla users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS balance_pending NUMERIC(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS balance_available NUMERIC(10,2) DEFAULT 0.00;

-- 2. Función atómica para liberar fondos de Escrow
-- Mueve el dinero de 'balance_pending' a 'balance_available'
CREATE OR REPLACE FUNCTION release_escrow_funds(target_seller_id UUID, payout_amount NUMERIC)
RETURNS VOID AS $$
BEGIN
    -- Validar que el usuario existe
    IF NOT EXISTS (SELECT 1 FROM users WHERE id = target_seller_id) THEN
        RAISE EXCEPTION 'Usuario no encontrado';
    END IF;

    -- Actualizar balances de forma atómica
    UPDATE users 
    SET 
        balance_pending = COALESCE(balance_pending, 0) - payout_amount,
        balance_available = COALESCE(balance_available, 0) + payout_amount
    WHERE id = target_seller_id;

    -- Nota: Podríamos agregar un registro en una tabla de auditoría/transacciones aquí.
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. (Opcional) Asegurar que order_items tenga los campos necesarios
-- Basado en migraciones previas pero asegurando consistencia
ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS payout_released BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS received_at TIMESTAMPTZ;
