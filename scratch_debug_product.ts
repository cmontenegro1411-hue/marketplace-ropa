
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  const { supabaseAdmin } = await import("./lib/supabase-admin");

  const { data: purchases, error } = await supabaseAdmin
    .from('order_items')
    .select('*, products(*), orders!inner(*)')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error("Error fetching purchases:", error);
    return;
  }

  console.log("Recent Purchases:");
  purchases?.forEach(p => {
    console.log(`- Order Item ID: ${p.id}`);
    console.log(`  Product ID: ${p.product_id}`);
    console.log(`  Product Title: ${p.products?.title}`);
    console.log(`  Buyer ID: ${p.orders?.buyer_id}`);
    console.log(`  Status: ${p.status}`);
    console.log('---');
  });
  
  if (purchases && purchases.length > 0) {
    const productId = purchases[0].product_id;
    console.log(`\nChecking Product ${productId} details like in page.tsx...`);
    
    // Testing the same query as in page.tsx
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('*, sellers:users!seller_id(*)')
      .eq('id', productId)
      .single();
      
    if (productError) {
      console.log("Product Query Error (stringified):", JSON.stringify(productError, null, 2));
      console.log("Product Query Error (message):", productError.message);
    } else {
      console.log("Product found with sellers join!");
      console.log(`Seller Name: ${product.sellers?.name}`);
    }
  }
}

run();
