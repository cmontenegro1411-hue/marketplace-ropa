
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSebastianOrder() {
  console.log("Searching for Sebastian Miñano's orders...");
  
  const { data: orders, error: orderError } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .ilike('buyer_name', '%Sebastian%')
    .order('created_at', { ascending: false });

  if (orderError) {
    console.error("Error fetching orders:", orderError);
    return;
  }

  if (!orders || orders.length === 0) {
    console.log("No orders found for Sebastian.");
    return;
  }

  orders.forEach(order => {
    console.log(`\nOrder ID: ${order.id}`);
    console.log(`Buyer: ${order.buyer_name}`);
    console.log(`Email: ${order.buyer_email}`);
    console.log(`Payment Status: ${order.payment_status}`);
    console.log(`Created At: ${order.created_at}`);
    
    console.log("Items:");
    order.order_items.forEach((item: any) => {
      console.log(`  - Item ID: ${item.id}`);
      console.log(`    Product ID: ${item.product_id}`);
      console.log(`    Status: ${item.status}`);
      console.log(`    Price: ${item.price}`);
    });
  });
}

checkSebastianOrder();
