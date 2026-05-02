require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function checkSellers() {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, balance_available, balance_pending')
    .eq('role', 'seller');

  if (error) {
    console.error("Error fetching sellers:", error);
    return;
  }

  console.log("--- Sellers ---");
  data.forEach(seller => {
    console.log(`ID: ${seller.id}, Name: ${seller.name}, Available: ${seller.balance_available}, Pending: ${seller.balance_pending}`);
  });
}

checkSellers();
