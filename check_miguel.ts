import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

import { generateConfirmToken } from './lib/order-tokens';

async function testToken() {
  console.log("Testing Token Generation...");
  try {
    const token = generateConfirmToken('90885489-3dec-4936-8297-abc8dbd835a0', 'e5c77c9d-0f25-46a0-a16d-f5cceaa96cc5');
    console.log("Token:", token);
  } catch (error) {
    console.error("Error generating token:", error);
  }
}

testToken();
