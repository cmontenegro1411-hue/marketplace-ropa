
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function finalAudit() {
  const sellers = ['Jennyfer Garay', 'Miguel Rios'];
  
  for (const name of sellers) {
    console.log(`\n--- AUDITANDO: ${name} ---`);
    const { data: profile } = await supabase.from('profiles').select('id, balance_available').ilike('full_name', name).single();
    
    if (!profile) continue;
    console.log(`ID: ${profile.id}, Billetera: S/ ${profile.balance_available}`);

    // Ver items en órdenes completadas
    const { data: items } = await supabase
      .from('order_items')
      .select(`
        id, 
        price, 
        order_id, 
        order:orders(payment_status),
        product:products(title, seller_id)
      `)
      .eq('products.seller_id', profile.id)
      .eq('orders.payment_status', 'completed');

    console.log(`Items encontrados con pago completado: ${items?.length || 0}`);
    items?.forEach(it => {
        console.log(`- Item ${it.id} (Orden ${it.order_id}): S/ ${it.price} - ${it.product?.title}`);
    });
    
    const total = items?.reduce((sum, it) => sum + (it.price || 0), 0);
    console.log(`SUMA TOTAL CALCULADA: S/ ${total}`);
  }
}

finalAudit();
