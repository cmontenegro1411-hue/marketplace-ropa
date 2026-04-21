-- 1. Crear tabla de órdenes si no existe
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    buyer_name TEXT,
    buyer_email TEXT,
    buyer_phone TEXT,
    total_amount NUMERIC,
    items JSONB, -- Resumen de items
    payment_status TEXT DEFAULT 'pendiente'
);

-- 2. Crear tabla de items de orden si no existe (para analítica y vendedores)
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    seller_id UUID REFERENCES users(id),
    price NUMERIC,
    status TEXT DEFAULT 'pendiente',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Habilitar RLS (Opcional, pero recomendado por seguridad)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- 4. Políticas básicas para que el Admin vea todo y el vendedor vea lo suyo
-- (Esto asume que el admin tiene role = 'admin')

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can see all orders') THEN
        CREATE POLICY "Admins can see all orders" ON orders FOR SELECT USING (
            EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can see all order items') THEN
        CREATE POLICY "Admins can see all order items" ON order_items FOR SELECT USING (
            EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
        );
    END IF;
END $$;
