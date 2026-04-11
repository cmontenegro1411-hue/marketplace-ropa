import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Error: Faltan las variables de entorno de Supabase.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function purge() {
  console.log("🧹 Iniciando limpieza de la base de datos...");
  
  // Borrar todos los productos
  const { error } = await supabase
    .from('products')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Borra todo sin filtro

  if (error) {
    console.error(`❌ Error limpiando el catálogo:`, error.message);
  } else {
    console.log(`✅ Catálogo de productos eliminado por completo. Base de datos en blanco.`);
  }
}

purge();
