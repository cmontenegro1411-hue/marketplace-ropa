require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function cleanup() {
  console.log('🚀 Iniciando limpieza de datos de prueba (Test User)...');

  // 1. Buscar órdenes de prueba creadas hoy con buyer_name "Test User"
  const { data: orders, error: oError } = await supabase
    .from('orders')
    .select('id')
    .eq('buyer_name', 'Test User')
    .eq('buyer_email', 'test@example.com');

  if (oError) {
    console.error('❌ Error buscando órdenes:', oError.message);
    return;
  }

  if (!orders || orders.length === 0) {
    console.log('✅ No se encontraron órdenes de prueba para limpiar.');
    return;
  }

  const orderIds = orders.map(o => o.id);
  console.log(`🔍 Encontradas ${orderIds.length} órdenes de prueba.`);

  // 2. Obtener items para restaurar stock y revertir balances
  const { data: items, error: iError } = await supabase
    .from('order_items')
    .select('id, product_id, seller_id, payout_amount')
    .in('order_id', orderIds);

  if (iError) {
    console.error('❌ Error obteniendo items:', iError.message);
  } else if (items && items.length > 0) {
    const productIds = items.map(item => item.product_id);
    
    // A. Restaurar stock a 'available'
    const { error: sError } = await supabase
      .from('products')
      .update({ status: 'available' })
      .in('id', productIds);
    if (sError) console.error('❌ Error restaurando stock:', sError.message);
    else console.log(`✅ Stock restaurado para ${productIds.length} productos.`);

    // B. Revertir balance_pending de los vendedores
    for (const item of items) {
      console.log(`⏳ Revirtiendo S/ ${item.payout_amount} para vendedor ${item.seller_id}...`);
      const { data: profile } = await supabase
        .from('profiles')
        .select('balance_pending')
        .eq('id', item.seller_id)
        .single();
      
      if (profile) {
        const newBalance = Math.max(0, profile.balance_pending - item.payout_amount);
        await supabase
          .from('profiles')
          .update({ balance_pending: Math.max(0, newBalance) })
          .eq('id', item.seller_id);
      }
    }
    console.log('✅ Balances de vendedores ajustados.');

    // C. Eliminar order_items
    await supabase.from('order_items').delete().in('order_id', orderIds);
    console.log('✅ Order items eliminados.');
  }

  // 3. Eliminar órdenes
  const { error: delOrderError } = await supabase
    .from('orders')
    .delete()
    .in('id', orderIds);
  
  if (delOrderError) console.error('❌ Error eliminando órdenes:', delOrderError.message);
  else console.log('✅ Órdenes de prueba eliminadas.');

  console.log('✨ Limpieza exitosa. Los totales de la plataforma están intactos.');
}

cleanup();
