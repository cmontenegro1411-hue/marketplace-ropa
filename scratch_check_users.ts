
import * as dotenv from 'dotenv';
dotenv.config();

async function checkUserVisibility() {
  const { createClient } = await import('@supabase/supabase-js');
  
  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Intentar buscar el vendedor de la prenda encontrada antes
  const sellerId = 'da54d246-86c0-42f8-958b-967b0d7407e3'; // Jennyfer Garay ID de la prueba anterior
  
  const { data: user, error: userError } = await anonClient
    .from('users')
    .select('name')
    .eq('id', sellerId)
    .single();
    
  console.log("Anon check for user visibility:");
  console.log("Error:", userError?.message || "None");
  console.log("Data:", user ? JSON.stringify(user) : "null");
}

checkUserVisibility();
