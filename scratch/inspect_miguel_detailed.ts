
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspectMiguelDetailed() {
  const miguelId = 'f587d410-fe76-4a1c-85f5-5c7c1de2febc';
  console.log('--- Detailed Wallet Transactions for Miguel Rios ---');

  const { data: txs, error } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('user_id', miguelId);

  if (error) {
    console.error('Error:', error);
    return;
  }

  for (const t of txs) {
    console.log(`Date: ${t.created_at}`);
    console.log(`Type: ${t.type} | Amount: ${t.amount}`);
    console.log(`Order ID: ${t.order_id}`);
    console.log(`Item ID: ${t.order_item_id}`);
    console.log(`Description: ${t.description}`);
    console.log('---');
  }
}

inspectMiguelDetailed();
