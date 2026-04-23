
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkStrangeCapture() {
  const id = '310404cc-3a1c-45a5-8e76-d20dcb212731'; // From previous log
  const { data: capture } = await supabase.from('wallet_transactions').select('*').eq('id', id).single();
  console.log('Capture:', JSON.stringify(capture, null, 2));
}

checkStrangeCapture();
