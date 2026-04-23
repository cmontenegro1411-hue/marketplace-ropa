
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function findProduct() {
  const title = "Tomy Camiseta beige casual para hombre de algodón";
  console.log(`Searching for product: ${title}`);
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .ilike('title', `%${title}%`);

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Result:', JSON.stringify(data, null, 2));
  }
}

findProduct();
