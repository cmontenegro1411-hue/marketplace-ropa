require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function checkSchema() {
  const { data, error } = await supabase
    .from('platform_revenue')
    .select('*')
    .limit(1);

  if (error) {
    console.error("Error fetching platform revenue:", error);
  } else {
    console.log("platform_revenue exists");
  }

  const { data: orderItems, error: itemsError } = await supabase
    .from('order_items')
    .select('*')
    .limit(1);

  if (itemsError) {
    console.error("Error fetching order_items:", itemsError);
  } else {
    console.log("order_items exists");
  }
}

checkSchema();
