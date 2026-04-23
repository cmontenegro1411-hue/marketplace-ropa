import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStatus() {
  console.log("Checking recent wallet transactions...");
  const { data: txs, error: txError } = await supabase
    .from('wallet_transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  if (txError) {
    console.error("Error fetching transactions:", txError);
  } else {
    console.log("Recent Transactions:", JSON.stringify(txs, null, 2));
  }

  console.log("\nChecking all user balances...");
  const { data: users, error: userError } = await supabase
    .from('users')
    .select('id, name, email, balance_pending, balance_available')
    .or('balance_pending.gt.0,balance_available.gt.0');

  if (userError) {
    console.error("Error fetching users:", userError);
  } else {
    console.log("Users with Balance:", JSON.stringify(users, null, 2));
  }
}

checkStatus();
