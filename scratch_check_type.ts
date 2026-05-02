
import * as dotenv from 'dotenv';
dotenv.config();

async function checkSellersType() {
  const { supabaseAdmin } = await import("./lib/supabase-admin");

  const { data: product, error } = await supabaseAdmin
    .from('products')
    .select('*, sellers:users!seller_id(*)')
    .limit(1)
    .single();

  if (error) {
    console.error("Error:", error.message);
    return;
  }

  console.log("Type of sellers:", Array.isArray(product.sellers) ? "Array" : typeof product.sellers);
  console.log("Sellers data:", JSON.stringify(product.sellers, null, 2));
}

checkSellersType();
