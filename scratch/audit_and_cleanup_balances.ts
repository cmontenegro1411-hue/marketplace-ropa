import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function cleanupAllBalances() {
  console.log('--- Iniciando Auditoría y Limpieza Masiva de Saldos ---');

  // 1. Obtener todos los vendedores con saldo pendiente > 0
  const { data: users, error: userErr } = await supabase
    .from('users')
    .select('id, name, email, balance_pending')
    .gt('balance_pending', 0);

  if (userErr) {
    console.error('Error obteniendo usuarios:', userErr.message);
    return;
  }

  console.log(`Vendedores encontrados con saldo pendiente: ${users?.length || 0}`);

  for (const user of users || []) {
    console.log(`\nRevisando vendedor: ${user.name} (${user.email}) - Pendiente: S/ ${user.balance_pending}`);

    // 2. Buscar si tiene order_items activos (que justifiquen ese saldo)
    // Estado 'pending' o 'disputed' justifica el balance_pending
    const { data: activeItems, error: itemErr } = await supabase
      .from('order_items')
      .select('id, payout_amount, status, products(title)')
      .eq('seller_id', user.id)
      .in('status', ['pending', 'disputed']);

    if (itemErr) {
      console.error(`Error buscando items para ${user.name}:`, itemErr.message);
      continue;
    }

    const totalJustified = activeItems?.reduce((sum, item) => sum + (item.payout_amount || 0), 0) || 0;
    console.log(`Saldo justificado por órdenes activas: S/ ${totalJustified}`);

    if (user.balance_pending > totalJustified) {
      const ghostBalance = user.balance_pending - totalJustified;
      console.log(`⚠️ DISCREPANCIA DETECTADA: S/ ${ghostBalance} son saldos fantasma.`);

      // 3. Corregir balance_pending
      const { error: upErr } = await supabase
        .from('users')
        .update({ balance_pending: totalJustified })
        .eq('id', user.id);

      if (upErr) {
        console.error(`Error corrigiendo balance de ${user.name}:`, upErr.message);
      } else {
        console.log(`✅ Balance de ${user.name} corregido exitosamente a S/ ${totalJustified}`);
        
        // Registrar la corrección en wallet_transactions para auditoría
        await supabase.from('wallet_transactions').insert({
            user_id: user.id,
            type: 'refund',
            amount: -ghostBalance,
            description: "Auditoría: Corrección de saldo fantasma por limpieza de base de datos",
            balance_after_pending: totalJustified,
            balance_after_available: 0 // Asumiendo 0 para simplificar el script de auditoría
        });
      }
    } else {
      console.log(`✅ Saldo de ${user.name} es correcto.`);
    }
  }

  console.log('\n--- Auditoría completada ---');
}

cleanupAllBalances();
