-- Migración: Captura de Escrow y Auditoría de Billetera
-- Fecha: 2026-04-22
-- Versión: 1.7.1

-- 1. Crear tabla de transacciones de billetera para auditoría
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    order_id UUID, -- Referencia opcional a la orden
    order_item_id UUID, -- Referencia opcional al item específico
    type TEXT NOT NULL, -- 'capture', 'release', 'refund', 'withdrawal'
    amount NUMERIC(10,2) NOT NULL,
    balance_after_pending NUMERIC(10,2),
    balance_after_available NUMERIC(10,2),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS en la tabla de transacciones
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver sus propias transacciones
CREATE POLICY "Users can view own transactions" 
ON wallet_transactions FOR SELECT 
USING (auth.uid() = user_id);

-- 2. RPC: Capturar fondos en Escrow (Pending)
CREATE OR REPLACE FUNCTION capture_escrow_funds(
    target_seller_id UUID, 
    payout_amount NUMERIC,
    ref_order_id UUID DEFAULT NULL,
    ref_order_item_id UUID DEFAULT NULL,
    tx_description TEXT DEFAULT 'Venta capturada en Escrow'
)
RETURNS VOID AS $$
DECLARE
    new_pending NUMERIC;
    new_available NUMERIC;
BEGIN
    -- 1. Actualizar balance pendiente
    UPDATE users 
    SET balance_pending = COALESCE(balance_pending, 0) + payout_amount
    WHERE id = target_seller_id
    RETURNING balance_pending, balance_available INTO new_pending, new_available;

    -- 2. Registrar transacción de auditoría
    INSERT INTO wallet_transactions (
        user_id, order_id, order_item_id, type, amount, 
        balance_after_pending, balance_after_available, description
    ) VALUES (
        target_seller_id, ref_order_id, ref_order_item_id, 'capture', payout_amount,
        new_pending, new_available, tx_description
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. RPC: Liberar fondos de Escrow (Pending -> Available)
-- Sobrescribimos la versión anterior para incluir auditoría
CREATE OR REPLACE FUNCTION release_escrow_funds(
    target_seller_id UUID, 
    payout_amount NUMERIC,
    ref_order_item_id UUID DEFAULT NULL,
    tx_description TEXT DEFAULT 'Fondos liberados de Escrow'
)
RETURNS VOID AS $$
DECLARE
    new_pending NUMERIC;
    new_available NUMERIC;
BEGIN
    -- 1. Actualizar balances de forma atómica
    UPDATE users 
    SET 
        balance_pending = COALESCE(balance_pending, 0) - payout_amount,
        balance_available = COALESCE(balance_available, 0) + payout_amount
    WHERE id = target_seller_id
    RETURNING balance_pending, balance_available INTO new_pending, new_available;

    -- 2. Registrar transacción de auditoría
    INSERT INTO wallet_transactions (
        user_id, order_item_id, type, amount, 
        balance_after_pending, balance_after_available, description
    ) VALUES (
        target_seller_id, ref_order_item_id, 'release', payout_amount,
        new_pending, new_available, tx_description
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
