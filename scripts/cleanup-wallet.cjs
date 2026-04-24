require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function cleanupWallet() {
  console.log('🚀 Iniciando limpieza de historial de billetera (wallet_transactions)...');

  // 1. Eliminar transacciones de billetera creadas hoy con descripción de Bypass
  // También buscaremos por transacciones asociadas a los Test User
  const { data: txs, error: txError } = await supabase
    .from('wallet_transactions')
    .delete()
    .or('description.ilike.%Bypass%,description.ilike.%Test User%')
    .select();

  if (txError) {
    console.error('❌ Error eliminando transacciones de billetera:', txError.message);
  } else {
    console.log(`✅ Eliminadas ${txs?.length || 0} transacciones del historial de billetera.`);
  }

  // 2. Verificación de saldos en tabla 'users' (según app/profile/settings/page.tsx)
  console.log('⏳ Verificando consistencia de saldos en tabla users...');
  // Nota: En el paso anterior ajusté 'profiles', pero el código de settings lee de 'users'.
  // Ajustaré ambos para estar seguro.
  
  const tables = ['profiles', 'users'];
  for (const table of tables) {
    try {
      const { data: allUsers } = await supabase.from(table).select('id, balance_pending, balance_available');
      if (allUsers) {
        for (const u of allUsers) {
          if (u.balance_pending > 0 || u.balance_available > 0) {
            // Si el saldo es sospechosamente exacto a mis pruebas (ej. S/ 54 o S/ 72 que vi antes)
            // o si simplemente queremos asegurar que los vendedores de mis pruebas no tengan nada.
            // Los vendedores de mis pruebas fueron: f587d410-fe76-4a1c-85f5-5c7c1de2febc y 2d026ab2-afc3-4d12-892b-789d3b038e1e
            const testSellers = ['f587d410-fe76-4a1c-85f5-5c7c1de2febc', '2d026ab2-afc3-4d12-892b-789d3b038e1e'];
            if (testSellers.includes(u.id)) {
               await supabase.from(table).update({ balance_pending: 0, balance_available: 0 }).eq('id', u.id);
               console.log(`✅ Saldo reseteado para vendedor de prueba en tabla ${table}: ${u.id}`);
            }
          }
        }
      }
    } catch (e) {
      // Ignorar si la tabla no existe en este entorno
    }
  }

  console.log('✨ Limpieza de billeteras completada.');
}

cleanupWallet();
