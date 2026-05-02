const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function finalReset() {
  console.log('🚀 Iniciando Reseteo Final para Producción (V2)...');

  try {
    // 1. Tablas a vaciar completamente
    const tablesToEmpty = [
      'order_items', 
      'orders', 
      'wallet_transactions', 
      'ai_generations_log',
      'product_reviews'
    ];

    for (const table of tablesToEmpty) {
      console.log(`--- Limpiando ${table} ---`);
      const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) console.error(`Error deleting ${table}:`, error.message);
      else console.log(`✅ ${table} eliminada.`);
    }

    // 2. Resetear Productos
    console.log('--- Reseteando Productos a AVAILABLE ---');
    const { error: errProd } = await supabase
      .from('products')
      .update({
        status: 'available',
        is_sold: false,
        buyer_name: null,
        buyer_phone: null,
        buyer_email: null,
        shipped_at: null,
        tracking_number: null,
        conformity_token: null,
        buyer_conformity: null,
        net_payout: null
      })
      .neq('id', '00000000-0000-0000-0000-000000000000');
    if (errProd) console.error('Error resetting products:', errProd.message);
    else console.log('✅ Todos los productos están ahora Disponibles.');

    // 3. Resetear Billeteras de Usuarios (TODOS)
    console.log('--- Limpiando Billeteras de Usuarios ---');
    const { error: errWallet } = await supabase
      .from('users')
      .update({
        balance_pending: 0,
        balance_available: 0
      })
      .neq('id', 'ffffffff-ffff-ffff-ffff-ffffffffffff'); // Target all
    if (errWallet) console.error('Error resetting wallets:', errWallet.message);
    else console.log('✅ Balances de todos los usuarios reseteados a 0.');

    // 4. Resetear Créditos de Publicación
    console.log('--- Reseteando Créditos de Publicación ---');
    const { error: errCredits } = await supabase
      .from('listing_credits')
      .update({
        credits_used: 0
      })
      .neq('id', '00000000-0000-0000-0000-000000000000');
    if (errCredits) console.error('Error resetting credits:', errCredits.message);
    else console.log('✅ Créditos de publicación reseteados.');

    console.log('\n✨ RESETEO FINAL COMPLETADO. Sistema limpio y listo para producción.');

  } catch (error) {
    console.error('❌ Error catastrófico:', error);
  }
}

finalReset();
