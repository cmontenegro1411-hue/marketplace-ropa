const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkState() {
  const { count: pending } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('payment_status', 'pendiente');

  const { count: total } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true });

  console.log(`Pending orders: ${pending}`);
  console.log(`Total orders: ${total}`);
}

checkState();
