
import { supabaseAdmin } from "./lib/supabase-admin";

async function checkSellerWallet() {
  const sellerId = '9c2ac0db-dcc1-4d54-b63f-46bae8046281';
  const { data: wallet, error } = await supabaseAdmin
    .from('wallet_transactions')
    .select('*')
    .eq('user_id', sellerId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error:", error);
    return;
  }

  console.log(JSON.stringify(wallet, null, 2));
}

checkSellerWallet();
