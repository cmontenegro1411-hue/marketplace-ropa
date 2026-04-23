
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listSoldDetailed() {
  const { data, error } = await supabase
    .from('products')
    .select('id, title, price, seller_id, status')
    .eq('status', 'sold');

  if (error) {
    console.error('Error:', error);
  } else {
    console.log(`Found ${data.length} sold products.`);
    data.forEach(p => console.log(`ID: ${p.id} | Title: ${p.title} | Price: ${p.price} | Seller: ${p.seller_id}`));
  }
}

listSoldDetailed();
