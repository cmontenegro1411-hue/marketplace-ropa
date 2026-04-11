import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Si estamos en el servidor y tenemos la llave maestra, la usamos para saltar RLS
const supabaseKey = (typeof window === 'undefined' && supabaseServiceKey) 
  ? supabaseServiceKey 
  : supabaseAnonKey;

if (!supabaseUrl || !supabaseKey) {
  console.warn("Supabase credentials not found. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env file.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
