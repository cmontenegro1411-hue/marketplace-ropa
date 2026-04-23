import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  const { data: pData, error: pError } = await supabase
    .from('products')
    .select('*')
    .limit(1);

  if (pError) {
    console.error('Error products:', pError);
  } else if (pData && pData.length > 0) {
    console.log('Columns in products table:', Object.keys(pData[0]));
    console.log('Sample data:', JSON.stringify(pData[0], null, 2));
  }
}

checkSchema();
