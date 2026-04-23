import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function crossReferenceOrders() {
  const { data: orders } = await supabase
    .from('orders')
    .select('*');

  const { data: products } = await supabase
    .from('products')
    .select('id, title, seller_id');

  const { data: users } = await supabase
    .from('users')
    .select('id, name');

  const userMap = new Map(users?.map(u => [u.id, u.name]));
  
  console.log('--- Cross-Referencing Orders with Sellers ---');
  orders?.forEach(order => {
    const items = order.items || [];
    const sellers = items.map((item: any) => {
      // Try to find product by title if ID is missing
      const product = products?.find(p => p.title === item.title || p.id === item.id);
      return product ? (userMap.get(product.seller_id) || product.seller_id) : 'Unknown';
    });

    console.log(`Order: ${order.id.substring(0,8)} | Status: ${order.payment_status} | Buyer: ${order.buyer_name} | Items: ${items.map((i:any)=>i.title).join(',')} | Sellers: ${[...new Set(sellers)].join(', ')}`);
  });
}

crossReferenceOrders();
