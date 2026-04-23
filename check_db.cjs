const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: users, error: errU } = await supabase.from('users').select('id, name, email').ilike('name', '%Miguel%Rios%');
  if (errU) console.error(errU);
  console.log("Miguel Rios Users:", users);

  if (users && users.length > 0) {
    const sellerId = users[0].id;
    const { data: items, error: errI } = await supabase.from('order_items').select('*').eq('seller_id', sellerId);
    if (errI) console.error(errI);
    console.log("Order Items for Miguel Rios:", items);
  }

  const { data: orders, error: errO } = await supabase.from('orders').select('id, buyer_name, payment_status, total_amount, created_at').order('created_at', { ascending: false }).limit(10);
  if (errO) console.error(errO);
  console.log("Recent Orders:", orders);
}

check();
