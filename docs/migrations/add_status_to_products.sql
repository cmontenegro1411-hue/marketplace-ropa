-- ============================================
-- MIGRACIÓN: Agregar columna 'status' a products
-- Fecha: 2026-04-11
-- Descripción: Permite rastrear si un producto
--              está disponible o ha sido vendido.
-- ============================================

-- 1. Agregar la columna con valor por defecto 'available'
ALTER TABLE products
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'available';

-- 2. Asegurarse que todos los productos existentes queden como disponibles
UPDATE products SET status = 'available' WHERE status IS NULL;

-- 3. Agregar un índice para que las queries por status sean rápidas
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);

-- 4. Verificar el resultado
SELECT id, title, status FROM products LIMIT 10;
