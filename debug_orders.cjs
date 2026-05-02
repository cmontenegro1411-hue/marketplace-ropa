require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function checkOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select('id, total_amount, payment_status, created_at, items');

  if (error) {
    console.error("Error fetching orders:", error);
    return;
  }

  console.log("--- Orders ---");
  data.forEach(order => {
    console.log(`ID: ${order.id}, Total: ${order.total_amount}, Status: ${order.payment_status}, Created: ${order.created_at}, Items count: ${order.items?.length || 0}`);
  });
}

checkOrders();
