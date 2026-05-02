require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function checkPlatformRevenue() {
  const { data, error } = await supabase
    .from('platform_revenue')
    .select('*');

  if (error) {
    console.error("Error fetching platform revenue:", error);
    return;
  }

  console.log("--- Platform Revenue ---");
  data.forEach(row => {
    console.log(`ID: ${row.id}, Type: ${row.type}, Amount: ${row.amount}, Reference: ${row.reference_id}, Created: ${row.created_at}`);
  });

  const totalsByType = data.reduce((acc, row) => {
    acc[row.type] = (acc[row.type] || 0) + Number(row.amount);
    return acc;
  }, {});

  console.log("\n--- Totals by Type ---");
  Object.entries(totalsByType).forEach(([type, total]) => {
    console.log(`${type}: S/ ${total}`);
  });
}

checkPlatformRevenue();
