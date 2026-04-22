require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function cleanBadProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('id, title');
    
  if (error) {
    console.error('Error fetching products:', error);
    return;
  }
  
  const badProducts = data.filter(p => !p.title || p.title.includes('Hackeado') || p.title.includes('<script>'));
  
  for (const p of badProducts) {
    console.log(`Deleting bad product: ${p.id} - ${p.title}`);
    await supabase.from('products').delete().match({ id: p.id });
  }
  console.log('Cleanup complete.');
}

cleanBadProducts();
