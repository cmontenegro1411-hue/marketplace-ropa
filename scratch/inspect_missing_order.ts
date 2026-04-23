
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspectOrders() {
  console.log('--- Inspecting all orders ---');
  const { data: orders, error } = await supabase
    .from('orders')
    .select('*');

  if (error) {
    console.error('Error fetching orders:', error);
    return;
  }

  console.log(`Found ${orders.length} orders.`);
  
  orders.forEach(order => {
    console.log(`Order ID: ${order.id}`);
    console.log(`Date: ${order.created_at}`);
    console.log(`Status: ${order.payment_status}`);
    console.log(`Items:`, JSON.stringify(order.items));
    console.log('---');
  });

  const searchItem = "Tomy Camiseta beige casual para hombre de algodón";
  const found = orders.filter(o => {
    const items = Array.isArray(o.items) ? o.items : [];
    return items.some((it: any) => it.title && it.title.includes("Tomy Camiseta beige"));
  });

  if (found.length > 0) {
    console.log(`Found ${found.length} orders matching the item.`);
    found.forEach(f => console.log(JSON.stringify(f, null, 2)));
  } else {
    console.log('No orders found with that item title.');
  }
}

inspectOrders();
