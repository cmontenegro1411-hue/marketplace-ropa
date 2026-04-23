
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listMiguelProducts() {
  const miguelId = 'f587d410-fe76-4a1c-85f5-5c7c1de2febc';
  console.log('--- Listing All Products for Miguel Rios ---');
  const { data: products } = await supabase.from('products').select('*').eq('seller_id', miguelId);
  console.log(JSON.stringify(products, null, 2));
}

listMiguelProducts();
