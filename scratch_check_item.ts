
import { supabaseAdmin } from "./lib/supabase-admin";

async function checkOrderItem() {
  const itemId = '61dbde42-a922-4084-9b6a-d72a2a696575';
  const { data: item, error } = await supabaseAdmin
    .from('order_items')
    .select('*, orders(*)')
    .eq('id', itemId)
    .single();

  if (error) {
    console.error("Error:", error);
    return;
  }

  console.log(JSON.stringify(item, null, 2));
}

checkOrderItem();
