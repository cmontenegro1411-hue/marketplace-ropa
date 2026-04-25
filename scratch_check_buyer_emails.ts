
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Cargar variables de entorno desde .env
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Faltan variables de entorno en .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkEmails() {
  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, buyer_email, buyer_name, total_amount, created_at, order_items(status, price)');

  if (error) {
    console.error('Error fetching orders:', error);
    return;
  }

  console.log(`Total orders found: ${orders.length}`);
  
  const buyerMap: Record<string, any> = {};
  
  orders.forEach(o => {
    const emailKey = (o.buyer_email || 'NULL').toLowerCase().trim();
    if (!buyerMap[emailKey]) {
      buyerMap[emailKey] = { name: o.buyer_name, total: 0, count: 0, orderDetails: [] };
    }
    
    let validTotal = 0;
    const items = (o.order_items as any[]) || [];
    items.forEach(item => {
      if (['pending', 'shipped', 'completed'].includes(item.status)) {
        validTotal += (item.price || 0);
      }
    });

    buyerMap[emailKey].total += validTotal;
    buyerMap[emailKey].count += 1;
    buyerMap[emailKey].orderDetails.push({ id: o.id, name: o.buyer_name, validTotal });
  });

  console.log('\n--- Buyer Ranking Breakdown ---');
  Object.keys(buyerMap).forEach(email => {
    const b = buyerMap[email];
    console.log(`Email: [${email}]`);
    console.log(`  Display Name: [${b.name}]`);
    console.log(`  Total Valid Spent: S/ ${b.total}`);
    console.log(`  Orders Count: ${b.count}`);
    console.log(`  Individual Orders:`, b.orderDetails);
    console.log('---------------------------');
  });
}

checkEmails();
