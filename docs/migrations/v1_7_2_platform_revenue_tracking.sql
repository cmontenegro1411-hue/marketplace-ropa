-- =============================================================
-- MIGRACIÓN: Seguimiento de Ingresos de Plataforma (Auditoría)
-- Fecha: 2026-04-23
-- Versión: 1.7.2
-- =============================================================

-- 1. Crear tabla de ingresos de plataforma
CREATE TABLE IF NOT EXISTS public.platform_revenue (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at     TIMESTAMPTZ DEFAULT NOW(),
    user_id        UUID REFERENCES public.users(id) ON DELETE SET NULL,
    amount         NUMERIC(10, 2) NOT NULL,
    currency       TEXT DEFAULT 'PEN',
    type           TEXT NOT NULL CHECK (type IN ('sales_commission', 'credit_purchase', 'plan_upgrade')),
    reference_id   TEXT, -- ID de la orden, pago de MP o referencia externa
    metadata       JSONB DEFAULT '{}'::jsonb
);

-- 2. Habilitar RLS
ALTER TABLE public.platform_revenue ENABLE ROW LEVEL SECURITY;

-- 3. Política: Solo administradores pueden ver esta tabla
CREATE POLICY "Admins can view platform revenue"
    ON public.platform_revenue
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

-- 4. Índices para reportes rápidos
CREATE INDEX IF NOT EXISTS idx_platform_revenue_type ON public.platform_revenue(type);
CREATE INDEX IF NOT EXISTS idx_platform_revenue_created ON public.platform_revenue(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_platform_revenue_user ON public.platform_revenue(user_id);

-- 5. Comentario de tabla
COMMENT ON TABLE public.platform_revenue IS 'Registro de auditoría inmutable de todos los ingresos generados para la plataforma.';
