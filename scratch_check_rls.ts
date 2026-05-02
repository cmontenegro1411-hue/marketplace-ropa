
import * as dotenv from 'dotenv';
dotenv.config();

async function checkPolicies() {
  const { supabaseAdmin } = await import("./lib/supabase-admin");
  const { createClient } = await import('@supabase/supabase-js');

  const { data: pgPolicies, error: pgError } = await supabaseAdmin
    .from('pg_policies')
    .select('*')
    .eq('tablename', 'products');
    
  if (pgError) {
    console.log("Could not fetch policies via pg_policies view:", pgError.message);
  } else {
    console.log("Policies for 'products':", JSON.stringify(pgPolicies, null, 2));
  }
  
  // Test anon visibility
  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: anonProduct, error: anonError } = await anonClient
    .from('products')
    .select('id, status')
    .eq('status', 'sold')
    .limit(1);
    
  console.log("\nAnon check for sold products:");
  console.log("Error:", anonError?.message || "None");
  console.log("Data count:", anonProduct?.length || 0);
  if (anonProduct && anonProduct.length > 0) {
    console.log("Sample sold product found by anon:", anonProduct[0].id);
  }
}

checkPolicies();
