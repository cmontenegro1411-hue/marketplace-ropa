
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspectOrder() {
  const id = '3d0a46ae-4ca9-41a8-8e1f-a24aab1d8dbe';
  const { data: order } = await supabase.from('orders').select('*').eq('id', id).single();
  console.log('Order Details:', JSON.stringify(order, null, 2));
}

inspectOrder();
