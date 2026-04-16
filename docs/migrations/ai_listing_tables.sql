-- =============================================================
-- MIGRACIÓN: Módulo AI Listing Generator
-- Fecha: 2026-04-15
-- Tablas: listing_credits + ai_generations_log
-- =============================================================

-- 1. Tabla de créditos por usuario
CREATE TABLE IF NOT EXISTS public.listing_credits (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan           TEXT NOT NULL DEFAULT 'free'
                   CHECK (plan IN ('free', 'starter', 'pro', 'unlimited')),
  credits_total  INTEGER NOT NULL DEFAULT 10,
  credits_used   INTEGER NOT NULL DEFAULT 0,
  reset_date     TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 month'),
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE public.listing_credits ENABLE ROW LEVEL SECURITY;

-- Solo el dueño puede leer sus créditos (el server usa service_role y bypasa RLS)
CREATE POLICY "credits_read_own"
  ON public.listing_credits
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 2. Tabla de log de generaciones (solo interno, no exponer al usuario)
CREATE TABLE IF NOT EXISTS public.ai_generations_log (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES public.users(id) ON DELETE SET NULL,
  listing_id     UUID REFERENCES public.products(id) ON DELETE SET NULL,
  model_used     TEXT DEFAULT 'gpt-4o',
  tokens_input   INTEGER DEFAULT 0,
  tokens_output  INTEGER DEFAULT 0,
  cost_usd       NUMERIC(10, 6) DEFAULT 0,
  success        BOOLEAN DEFAULT FALSE,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ai_generations_log ENABLE ROW LEVEL SECURITY;

-- Solo lectura propia (el admin puede ver todo vía service_role)
CREATE POLICY "log_read_own"
  ON public.ai_generations_log
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 3. Índices para performance
CREATE INDEX IF NOT EXISTS idx_listing_credits_user_id
  ON public.listing_credits(user_id);

CREATE INDEX IF NOT EXISTS idx_ai_log_user_created
  ON public.ai_generations_log(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_log_created
  ON public.ai_generations_log(created_at DESC);
