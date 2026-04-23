
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function restoreMissingOrder() {
  const orderData = {
    id: '3d0a46ae-4ca9-41a8-8e1f-a24aab1d8dbe',
    created_at: '2026-04-23T00:58:29Z',
    buyer_name: 'Mario Moreno',
    buyer_email: 'cmontenegrom@outlook.com',
    buyer_phone: '996523565',
    total_amount: 40,
    payment_status: 'completed',
    mp_application_fee: 4,
    items: [{
      brand: 'Tomy',
      price: 40,
      title: 'Camiseta beige casual para hombre de algodón'
    }]
  };

  console.log('Restoring missing order...');
  const { data, error } = await supabase
    .from('orders')
    .insert([orderData]);

  if (error) {
    console.error('Error restoring order:', error);
  } else {
    console.log('Order restored successfully.');
  }
}

restoreMissingOrder();
