-- Modulo de Pagos y Billetera (Wallet)

-- 1. Tabla de Ordenes (Compras)
CREATE TABLE IF NOT EXISTS orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES products(id),
    seller_id UUID NOT NULL REFERENCES users(id),
    buyer_id UUID REFERENCES users(id), -- puede ser null si compran como guest
    price_total NUMERIC(10, 2) NOT NULL,
    platform_fee NUMERIC(10, 2) NOT NULL,
    seller_earnings NUMERIC(10, 2) NOT NULL,
    status TEXT DEFAULT 'pending_delivery' CHECK (status IN ('pending_delivery', 'completed', 'cancelled', 'refunded')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON orders(buyer_id);

-- 2. Tabla de Retiros (Payouts)
CREATE TABLE IF NOT EXISTS payouts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    seller_id UUID NOT NULL REFERENCES users(id),
    amount NUMERIC(10, 2) NOT NULL,
    method TEXT NOT NULL, -- 'yape', 'plin', 'bank_transfer'
    destination_account TEXT NOT NULL, -- El numero de telefono o cuenta
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_payouts_seller_id ON payouts(seller_id);

-- RLS Policies
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

-- Los vendedores pueden ver sus ordenes
CREATE POLICY "Sellers can view their orders" ON orders FOR SELECT USING (auth.uid() = seller_id);
-- Los compradores pueden ver sus compras
CREATE POLICY "Buyers can view their orders" ON orders FOR SELECT USING (auth.uid() = buyer_id);

-- Los vendedores pueden ver y solicitar retiros
CREATE POLICY "Sellers can view their payouts" ON payouts FOR SELECT USING (auth.uid() = seller_id);
CREATE POLICY "Sellers can request payouts" ON payouts FOR INSERT WITH CHECK (auth.uid() = seller_id);
