
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function audit() {
  console.log('--- Comprehensive Audit ---');

  // 1. Get all sold products
  const { data: soldProducts } = await supabase
    .from('products')
    .select('id, title, price, seller_id, status')
    .eq('status', 'sold');

  console.log(`Found ${soldProducts?.length || 0} sold products in 'products' table.`);

  // 2. Get all orders
  const { data: orders } = await supabase
    .from('orders')
    .select('id, product_id, seller_id, total_price');

  const orderProductIds = new Set(orders?.map(o => o.product_id));
  console.log(`Found ${orders?.length || 0} records in 'orders' table.`);

  // 3. Find sold products without orders
  console.log('\n--- SOLD PRODUCTS WITHOUT ORDERS ---');
  for (const p of soldProducts || []) {
    if (!orderProductIds.has(p.id)) {
      console.log(`MISSING ORDER for product: "${p.title}" (ID: ${p.id}) - Price: ${p.price}`);
      
      // Look for wallet transaction
      const { data: walletTx } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('order_item_id', p.id)
        .eq('type', 'capture')
        .single();

      if (walletTx) {
        console.log(`   Wallet Capture Found! ID: ${walletTx.id}, Date: ${walletTx.created_at}`);
        
        // Get seller info
        const { data: seller } = await supabase.from('profiles').select('full_name').eq('id', p.seller_id).single();
        console.log(`   Seller: ${seller?.full_name || 'Unknown'} (ID: ${p.seller_id})`);
      } else {
        console.log(`   No wallet capture found for this product.`);
      }
    }
  }

  // 4. Find orders without sold status (just in case)
  console.log('\n--- ORDERS FOR NON-SOLD PRODUCTS (Inconsistency check) ---');
  const soldProductIds = new Set(soldProducts?.map(p => p.id));
  for (const o of orders || []) {
    if (!soldProductIds.has(o.product_id)) {
       const { data: p } = await supabase.from('products').select('title, status').eq('id', o.product_id).single();
       console.log(`Order exists for product ID ${o.product_id} ("${p?.title}"), but status is ${p?.status}`);
    }
  }
}

audit();
