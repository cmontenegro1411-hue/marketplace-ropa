
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

async function checkDates() {
  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, created_at, total_amount');

  if (error) {
    console.error(error);
    return;
  }

  console.log('Orders dates:');
  orders.forEach(o => {
    console.log(`ID: ${o.id.substring(0,8)} | Created At: ${o.created_at} | Total: S/ ${o.total_amount}`);
  });
}

checkDates();
