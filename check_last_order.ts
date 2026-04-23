import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
  console.log("Fetching recent orders...");
  const { data: orders, error } = await supabase.from('orders').select('id, buyer_name, payment_status, created_at, mp_payment_id').order('created_at', { ascending: false }).limit(3);
  if (error) console.error(error);
  console.log("Recent orders:", orders);
}

run();
