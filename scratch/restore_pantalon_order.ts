
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function restorePantalon() {
  const orderData = {
    id: 'e9add336-3d97-4d83-824b-ef1ef1c13b7a',
    created_at: '2026-04-23T04:08:31Z',
    buyer_name: 'Camilo Suarez',
    buyer_email: 'cmontenegrom@outlook.com',
    buyer_phone: '996525885',
    total_amount: 70,
    payment_status: 'completed',
    mp_application_fee: 7, // 10%
    items: [{
      brand: 'Tomy',
      price: 70,
      title: 'Pantalón Negro Clásico para Hombre - Elegancia Atemporal'
    }]
  };

  console.log('Restoring missing order for Pantalón Negro...');
  const { data, error } = await supabase
    .from('orders')
    .insert([orderData]);

  if (error) {
    console.error('Error restoring order:', error);
  } else {
    console.log('Order restored successfully.');
  }
}

restorePantalon();
