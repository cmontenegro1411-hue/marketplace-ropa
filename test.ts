import { supabaseAdmin } from './lib/supabase-admin';

async function run() {
  const { data } = await supabaseAdmin
    .from('products')
    .select('id, title, users!inner(mp_user_id, mp_access_token)')
    .limit(5);

  console.log(JSON.stringify(data, null, 2));
}

run();
