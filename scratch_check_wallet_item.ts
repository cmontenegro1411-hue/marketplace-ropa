
import { supabaseAdmin } from "./lib/supabase-admin";

async function checkWallet() {
  const itemId = 'c7957d2f-41aa-4504-845e-4c7ab685f81c';
  const { data: wallet, error } = await supabaseAdmin
    .from('wallet_transactions')
    .select('*')
    .eq('order_item_id', itemId);

  if (error) {
    console.error("Error:", error);
    return;
  }

  console.log(JSON.stringify(wallet, null, 2));
}

checkWallet();
