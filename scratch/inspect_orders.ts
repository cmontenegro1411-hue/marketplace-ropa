import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select('id, payment_status, total_amount, buyer_name, created_at, items');

  if (error) {
    console.error('Error fetching orders:', error);
    return;
  }

  console.log('--- Orders in Database ---');
  data?.forEach(o => {
    console.log(`ID: ${o.id}`);
    console.log(`Status: ${o.payment_status}`);
    console.log(`Buyer: ${o.buyer_name}`);
    console.log(`Amount: ${o.total_amount}`);
    console.log(`Date: ${o.created_at}`);
    console.log(`Items: ${JSON.stringify(o.items)}`);
    console.log('---');
  });

  const pending = data?.filter(o => o.payment_status === 'pendiente') || [];
  console.log(`\nFound ${pending.length} orders with status 'pendiente'`);
}

inspectOrders();
