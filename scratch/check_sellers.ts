import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSellers() {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, balance_available, balance_pending, role')
    .eq('role', 'seller');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('--- Sellers in Database ---');
  console.table(data);
}

checkSellers();
