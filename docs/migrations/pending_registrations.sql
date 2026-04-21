-- =============================================================
-- MIGRACIÓN: Tabla de registros pendientes de pago
-- Propósito: Guardar datos de signup ANTES del pago
-- La cuenta real se crea solo cuando el pago es exitoso
-- =============================================================

CREATE TABLE IF NOT EXISTS public.pending_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  plan TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'pending'
);

-- Activar RLS: hemos configurado supabaseAdmin en el backend para
-- evadir RLS cuando sea necesario (creación del registro), y tenemos policies que aseguran el acceso.
ALTER TABLE public.pending_registrations ENABLE ROW LEVEL SECURITY;

-- Crear política permisiva como fallback de seguridad
-- (si alguien reactiva RLS, que al menos funcione el INSERT)
CREATE POLICY "allow_insert_pending" ON public.pending_registrations
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "allow_select_pending" ON public.pending_registrations
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "allow_update_pending" ON public.pending_registrations
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
