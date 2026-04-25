
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkWalletTransactions() {
  const itemId = 'c7957d2f-41aa-4504-845e-4c7ab685f81c';
  console.log(`Checking wallet transactions for Item ID: ${itemId}`);
  
  const { data: txs, error } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('order_item_id', itemId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error("Error:", error);
    return;
  }

  txs.forEach(tx => {
    console.log(`\nTX ID: ${tx.id}`);
    console.log(`Type: ${tx.type}`);
    console.log(`Amount: ${tx.amount}`);
    console.log(`Description: ${tx.description}`);
    console.log(`Created At: ${tx.created_at}`);
  });
}

checkWalletTransactions();
