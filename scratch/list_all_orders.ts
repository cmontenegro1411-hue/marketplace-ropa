
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listAllOrders() {
  console.log('--- Listing All Orders in orders table ---');
  const { data: orders, error } = await supabase.from('orders').select('*');
  if (error) {
    console.error('Error:', error);
    return;
  }
  console.log(`Found ${orders.length} orders.`);
  for (const o of orders) {
    console.log(`ID: ${o.id} | Date: ${o.created_at} | Buyer: ${o.buyer_name} | Total: ${o.total_amount}`);
    if (Array.isArray(o.items)) {
      o.items.forEach((it: any) => console.log(`   - ${it.brand} ${it.title}`));
    }
  }
}

listAllOrders();
