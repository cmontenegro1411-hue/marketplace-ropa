import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
  const miguelId = 'f587d410-fe76-4a1c-85f5-5c7c1de2febc';
  const orderItemId = '90885489-3dec-4936-8297-abc8dbd835a0';
  
  console.log('--- Iniciando limpieza de wallet para Miguel Rios ---');

  // 1. Eliminar transacciones de wallet
  const { error: delError } = await supabase.from('wallet_transactions')
    .delete()
    .eq('user_id', miguelId)
    .eq('order_item_id', orderItemId);
    
  if (delError) {
    console.error('Error al eliminar transacciones:', delError);
  } else {
    console.log('Transacciones eliminadas correctamente.');
  }

  // 2. Resetear balance_pending
  // Consultamos el balance actual para estar seguros
  const { data: userData } = await supabase.from('users').select('balance_pending').eq('id', miguelId).single();
  console.log('Balance pendiente actual:', userData?.balance_pending);

  const { error: upError } = await supabase.from('users')
    .update({ balance_pending: 0 })
    .eq('id', miguelId);
    
  if (upError) {
    console.error('Error al resetear balance:', upError);
  } else {
    console.log('Balance pendiente reseteado a 0.');
  }

  // 3. Marcar order_item como cancelado
  const { error: itemError } = await supabase.from('order_items')
    .update({ status: 'cancelled' })
    .eq('id', orderItemId);
    
  if (itemError) {
    console.error('Error al cancelar item de orden:', itemError);
  } else {
    console.log('Item de orden marcado como cancelado.');
  }

  console.log('--- Limpieza completada ---');
}

run();
