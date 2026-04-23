import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function cleanOrders() {
  const phantomOrders = ['3d0a46ae-4ca9-41a8-8e1f-a24aab1d8dbe', 'e9add336-3d97-4d83-824b-ef1ef1c13b7a'];
  
  for (const orderId of phantomOrders) {
    // Delete order items
    await supabase.from('order_items').delete().eq('order_id', orderId);
    // Delete orders
    await supabase.from('orders').delete().eq('id', orderId);
  }
  console.log("Deleted restored phantom orders");
}

cleanOrders();
