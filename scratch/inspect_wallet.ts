
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspectWallet() {
  console.log('--- Inspecting wallet_transactions ---');
  const { data: transactions, error } = await supabase
    .from('wallet_transactions')
    .select('*');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Found ${transactions.length} transactions.`);
  
  transactions.forEach(t => {
    console.log(`${t.created_at} | ${t.type} | Item: ${t.order_item_id} | Amount: ${t.amount} | Status: ${t.status}`);
  });
}

inspectWallet();
