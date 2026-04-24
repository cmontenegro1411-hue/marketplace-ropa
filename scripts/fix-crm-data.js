
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixOrders() {
  console.log("🔍 Buscando órdenes de Luis Lock y Karina Ramirez...");

  // 1. Encontrar las órdenes
  const { data: orders, error: fetchErr } = await supabase
    .from('orders')
    .select('id, buyer_name, payment_status')
    .in('buyer_name', ['Luis Lock', 'Karina Ramirez']);

  if (fetchErr) {
    console.error("Error al buscar órdenes:", fetchErr);
    return;
  }

  if (!orders || orders.length === 0) {
    console.log("⚠️ No se encontraron órdenes para los nombres especificados.");
    return;
  }

  for (const order of orders) {
    console.log(`📦 Procesando Orden ID: ${order.id} (${order.buyer_name}) - Estado actual: ${order.payment_status}`);
    
    // 2. Forzar estado refunded en la orden
    const { error: updateOrderErr } = await supabase
      .from('orders')
      .update({ payment_status: 'refunded' })
      .eq('id', order.id);

    if (updateOrderErr) {
      console.error(`❌ Error actualizando orden ${order.id}:`, updateOrderErr);
    } else {
      console.log(`✅ Orden ${order.id} marcada como 'refunded'.`);
    }

    // 3. Asegurar que los ítems también estén marcados como refunded
    const { error: updateItemsErr } = await supabase
      .from('order_items')
      .update({ status: 'refunded' })
      .eq('order_id', order.id);

    if (updateItemsErr) {
      console.error(`❌ Error actualizando ítems de orden ${order.id}:`, updateItemsErr);
    } else {
      console.log(`✅ Ítems de la orden ${order.id} sincronizados.`);
    }
  }

  console.log("\n🚀 Sincronización completada. El dashboard debería reflejar los cambios ahora.");
}

fixOrders();
