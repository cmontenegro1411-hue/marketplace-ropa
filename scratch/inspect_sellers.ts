import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectSellers() {
  const { data: orders } = await supabase
    .from('orders')
    .select('id, payment_status, items, buyer_name');

  const { data: users } = await supabase
    .from('users')
    .select('id, full_name');

  const userMap = new Map(users?.map(u => [u.id, u.full_name]));

  console.log('--- Orders and their Sellers ---');
  orders?.forEach(o => {
    const items = Array.isArray(o.items) ? o.items : JSON.parse(o.items as string || '[]');
    const sellerIds = items.map((it: any) => it.seller_id);
    const sellerNames = sellerIds.map((id: string) => userMap.get(id) || id);
    
    console.log(`ID: ${o.id.substring(0,8)} | Status: ${o.payment_status} | Buyer: ${o.buyer_name} | Sellers: ${sellerNames.join(', ')}`);
  });
}

inspectSellers();
