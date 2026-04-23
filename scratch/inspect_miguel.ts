
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspectMiguel() {
  const miguelId = 'f587d410-fe76-4a1c-85f5-5c7c1de2febc';
  console.log('--- Inspecting Wallet Transactions for Miguel Rios ---');

  const { data: txs, error } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('user_id', miguelId); // Fixed column name

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Found ${txs.length} transactions for Miguel.`);
  for (const t of txs) {
    console.log(`${t.created_at} | ${t.type} | Amount: ${t.amount} | Item: ${t.order_item_id}`);
    
    // Try to find the product
    if (t.order_item_id) {
      const { data: prod } = await supabase.from('products').select('title, price').eq('id', t.order_item_id).single();
      if (prod) {
        console.log(`   Product: ${prod.title} (Price: ${prod.price})`);
      } else {
        console.log(`   Product ID ${t.order_item_id} NOT FOUND in products table.`);
      }
    }
  }
}

inspectMiguel();
