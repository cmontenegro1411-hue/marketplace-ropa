
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function search() {
  console.log('--- Searching for "Tomy" in products ---');
  const { data: products } = await supabase.from('products').select('*').ilike('title', '%Tomy%');
  console.log('Products:', JSON.stringify(products, null, 2));

  console.log('--- Searching for "Miguel Rios" in profiles ---');
  const { data: profiles } = await supabase.from('profiles').select('*').ilike('full_name', '%Miguel%');
  console.log('Profiles:', JSON.stringify(profiles, null, 2));
}

search();
