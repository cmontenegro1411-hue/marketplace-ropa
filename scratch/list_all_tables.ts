
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listAllTables() {
  const tables = ['orders', 'products', 'profiles', 'users', 'wallet_transactions', 'wallet_movements', 'credits'];
  
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`Table '${table}' does NOT exist or error: ${error.message}`);
    } else {
      console.log(`Table '${table}' exists. Rows: ${data.length}`);
    }
  }
}

listAllTables();
