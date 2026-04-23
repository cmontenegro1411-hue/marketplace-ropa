import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupData() {
  const idsToDelete = [
    'a7bbacc2-d83e-4b89-ac48-581723da6c78', // Pendiente Miguel
    'a1f7857d-f8db-4614-ab5c-c30c65ee8f66', // Pendiente Miguel
    '1e27653e-aa6a-4652-a1c6-d51d450a91eb', // Pendiente Jennyfer
    'c1a2d2ad-4ffa-4399-8883-0e13053cd34b', // Refunded Miguel
    '98c56793-fd35-4388-9cef-9fba675225bd', // Completed Junk 50 Miguel
    'a9ce7119-ae99-4397-ac09-eb91af2cd413'  // Completed Junk 40 Miguel
  ];

  console.log(`Starting cleanup of ${idsToDelete.length} orders...`);

  const { data, error } = await supabase
    .from('orders')
    .delete()
    .in('id', idsToDelete);

  if (error) {
    console.error('Error during cleanup:', error);
  } else {
    console.log('Cleanup successful.');
  }
}

cleanupData();
