
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function finalAudit() {
  console.log('--- FINAL AUDIT ---');

  // 1. Get all sold products
  const { data: products } = await supabase.from('products').select('id, title, status').eq('status', 'sold');
  console.log(`Found ${products?.length || 0} sold products.`);

  // 2. Get all orders
  const { data: orders } = await supabase.from('orders').select('id, items');
  console.log(`Found ${orders?.length || 0} orders.`);

  // 3. Map order items to product titles (best effort)
  const orderedTitles = new Set();
  for (const o of orders || []) {
    if (Array.isArray(o.items)) {
      o.items.forEach((it: any) => orderedTitles.add(it.title));
    }
  }

  // 4. Identify missing
  console.log('\nChecking for products not in any order:');
  for (const p of products || []) {
    if (!orderedTitles.has(p.title)) {
      console.log(`[MISSING] Product "${p.title}" (ID: ${p.id}) is SOLD but NOT in any order record.`);
    } else {
      console.log(`[OK] Product "${p.title}" is in an order.`);
    }
  }
}

finalAudit();
