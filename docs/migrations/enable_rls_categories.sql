-- ============================================================
-- Migration: Enable RLS on public.categories
-- Date: 2026-04-15
-- Reason: Security Advisor error - RLS Disabled in Public table
-- ============================================================

-- 1. Habilitar Row Level Security en la tabla
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- 2. Política: Lectura pública (cualquier usuario, incluso anónimo, puede leer categorías)
--    Esto es correcto porque las categorías son datos de referencia públicos.
CREATE POLICY "categories_public_read"
  ON public.categories
  FOR SELECT
  USING (true);

-- 3. Política: Solo el service_role puede insertar/actualizar/eliminar categorías
--    (administración interna, no se expone a usuarios comunes)
-- INSERT
CREATE POLICY "categories_admin_insert"
  ON public.categories
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- UPDATE
CREATE POLICY "categories_admin_update"
  ON public.categories
  FOR UPDATE
  USING (auth.role() = 'service_role');

-- DELETE
CREATE POLICY "categories_admin_delete"
  ON public.categories
  FOR DELETE
  USING (auth.role() = 'service_role');
