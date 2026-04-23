import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function check() {
  const { data: user } = await supabase.from('users').select('*').eq('name', 'Miguel Rios').single();
  console.log("Miguel's wallet_id:", user?.wallet_id);
  
  if (user?.wallet_id) {
    const { data: txs } = await supabase.from('wallet_transactions').select('*').eq('wallet_id', user.wallet_id);
    console.log("Txs:", txs);
  }
}
check();
