import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function checkOrders() {
  const { data: order } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(1).single();
  console.log("Last Order:", order);
}
checkOrders();
