import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function finalAudit() {
  const { data: orders } = await supabase.from('orders').select('*').eq('payment_status', 'completed');
  if (!orders) return;

  console.log(`Final completed orders: ${orders.length}`);
  for (const o of orders) {
    console.log(`- Order #${o.id.substring(0,8)} | Amount: S/ ${o.total_amount} | Buyer: ${o.buyer_name}`);
  }

  const { data: sellers } = await supabase.from('users').select('name, balance_available').eq('role', 'seller');
  console.log("\nSellers Balances:");
  sellers?.forEach(s => console.log(`- ${s.name}: S/ ${s.balance_available}`));
}

finalAudit();
