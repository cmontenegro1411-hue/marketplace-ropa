
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkIds() {
  const ids = [
    '2733743a-7349-4623-b2ec-2b216230f423',
    'a1305d13-c9ab-4adb-914b-ea6d329a4090',
    '748a40aa-ddd1-44b5-87a5-a02144b12ce7',
    'bc182507-0b67-4d23-88e0-b880ae4fec3b'
  ];

  console.log('--- Checking Product IDs ---');
  for (const id of ids) {
    const { data: product } = await supabase.from('products').select('id, title, seller_id, price').eq('id', id).single();
    if (product) {
      const { data: seller } = await supabase.from('profiles').select('full_name').eq('id', product.seller_id).single();
      console.log(`ID: ${id} | Title: ${product.title} | Seller: ${seller?.full_name || 'Unknown'} | Price: ${product.price}`);
    } else {
      console.log(`ID: ${id} | NOT FOUND in products table.`);
    }
  }
}

checkIds();
