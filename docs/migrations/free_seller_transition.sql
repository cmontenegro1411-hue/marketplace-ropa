-- =============================================================
-- MIGRACIÓN: Transición a Plataforma Libre y Créditos de IA (2)
-- Fecha: 2026-04-18
-- Objetivo: Eliminar límites de prendas y estandarizar 2 créditos de IA
-- =============================================================

-- 1. Eliminar la columna de límite de productos (Limpieza de código)
ALTER TABLE public.listing_credits DROP COLUMN IF EXISTS product_limit;

-- 2. Actualizar a todos los usuarios actuales:
--    - Plan 'free' para todos (libertad total de prendas)
--    - Créditos totales = 2 (nuevo tope gratuito)
UPDATE public.listing_credits
SET 
  plan = 'free',
  credits_total = 2;

-- 3. Asegurar que los registros de 'pending_registrations' también reflejen este cambio (si quedara alguno)
UPDATE public.pending_registrations
SET plan = 'free'
WHERE status = 'pending';
