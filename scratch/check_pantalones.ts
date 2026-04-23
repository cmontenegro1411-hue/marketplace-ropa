
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkPantalones() {
  const title = "Tomy Pantalón Negro Clásico para Hombre";
  console.log(`Checking order for: ${title}`);
  
  // Search in orders
  const { data: orders } = await supabase
    .from('orders')
    .select('*');
    
  const foundOrder = orders?.find(o => JSON.stringify(o.items).includes(title));
  
  if (foundOrder) {
    console.log('Order found in orders table:', foundOrder.id);
  } else {
    console.log('Order NOT found in orders table. Checking wallet...');
    const { data: txs } = await supabase
      .from('wallet_transactions')
      .select('*')
      .ilike('description', `%${title}%`);
    console.log('Wallet transactions:', JSON.stringify(txs, null, 2));
  }
}

checkPantalones();
