
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listTables() {
  const { data, error } = await supabase.rpc('get_tables_info'); // Assuming such RPC might not exist, I'll try querying information_schema if possible or just common ones

  // Better approach: try to query common tables we know about or use a generic query
  const tables = ['orders', 'seller_balances', 'seller_payouts', 'products', 'profiles', 'sellers', 'wallet_movements', 'wallet_history'];
  
  for (const table of tables) {
    const { data: sample, error } = await supabase.from(table).select('*').limit(1);
    if (!error) {
      console.log(`Table '${table}' exists.`);
    }
  }
}

listTables();
