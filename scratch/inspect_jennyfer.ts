
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspectJennyfer() {
  const jennyferId = '9c2ac0db-dcc1-4d54-b63f-46bae8046281';
  console.log('--- Inspecting Wallet Transactions for Jennyfer Garay ---');

  const { data: txs, error } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('user_id', jennyferId);

  if (error) {
    console.error('Error:', error);
    return;
  }

  for (const t of txs) {
    console.log(`${t.created_at} | ${t.type} | Amount: ${t.amount} | Order: ${t.order_id}`);
  }
}

inspectJennyfer();
