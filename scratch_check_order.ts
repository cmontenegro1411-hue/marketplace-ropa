
import { supabaseAdmin } from "./lib/supabase-admin";

async function checkOrder() {
  const { data: orders, error } = await supabaseAdmin
    .from('orders')
    .select('*, order_items(*, products(title))')
    .ilike('buyer_name', '%Sebastian%');

  if (error) {
    console.error("Error:", error);
    return;
  }

  console.log(JSON.stringify(orders, null, 2));
}

checkOrder();
