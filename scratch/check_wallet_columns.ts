
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkColumns() {
  const { data } = await supabase.from('wallet_transactions').select('*').limit(1);
  if (data && data.length > 0) {
    console.log('Columns in wallet_transactions:', Object.keys(data[0]));
  }
}

checkColumns();
