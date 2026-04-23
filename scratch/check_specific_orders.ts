
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSpecific() {
  const ids = [
    '3d0a46ae-4ca9-41a8-8e1f-a24aab1d8dbe',
    'e9add336-3d97-4d83-824b-ef1ef1c13b7a',
    '8e9c2b87-4079-4cd7-88c2-4b75b4ed326a'
  ];

  console.log('--- Checking Specific Order IDs in orders table ---');
  for (const id of ids) {
    const { data: order } = await supabase.from('orders').select('*').eq('id', id).single();
    if (order) {
      console.log(`Order ID: ${id} | FOUND | Total: ${order.total_amount} | Buyer: ${order.buyer_name}`);
    } else {
      console.log(`Order ID: ${id} | NOT FOUND`);
    }
  }
}

checkSpecific();
