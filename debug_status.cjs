require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function checkOrderItems() {
  const { data, error } = await supabase
    .from('order_items')
    .select('id, order_id, product_id, seller_id, status, price, payout_amount, created_at');

  if (error) {
    console.error("Error fetching order items:", error);
    return;
  }

  console.log("--- Order Items ---");
  data.forEach(item => {
    console.log(`ID: ${item.id}, Order: ${item.order_id}, Product: ${item.product_id}, Seller: ${item.seller_id}, Status: ${item.status}, Price: ${item.price}, Payout: ${item.payout_amount}, Created: ${item.created_at}`);
  });

  const totalsByStatus = data.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + (item.price || 0);
    return acc;
  }, {});

  console.log("\n--- Totals by Status ---");
  Object.entries(totalsByStatus).forEach(([status, total]) => {
    console.log(`${status}: S/ ${total}`);
  });
}

checkOrderItems();
