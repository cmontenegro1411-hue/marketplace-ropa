import { supabaseAdmin } from "../lib/supabase-admin.js";

/**
 * Script de automatización para liberar fondos de Escrow tras 72 horas de inactividad.
 * Este script debe ser ejecutado periódicamente (ej. vía CRON o Vercel Cron).
 */
async function autoReleaseFunds() {
  console.log("🚀 Iniciando proceso de liberación automática de Escrow...");

  const seventyTwoHoursAgo = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();

  // 1. Buscar order_items en estado 'pending' creados hace más de 72 horas
  const { data: items, error: fetchErr } = await supabaseAdmin
    .from('order_items')
    .select('*, sellers(id, balance_available, balance_pending)')
    .eq('status', 'pending')
    .lt('created_at', seventyTwoHoursAgo);

  if (fetchErr) {
    console.error("❌ Error al obtener ítems pendientes:", fetchErr);
    return;
  }

  if (!items || items.length === 0) {
    console.log("✅ No hay ítems pendientes de liberación automática.");
    return;
  }

  console.log(`📦 Procesando ${items.length} ítems para liberación...`);

  for (const item of items) {
    try {
      const payoutAmount = item.payout_amount || (item.price * 0.85);

      // Liberar fondos en DB
      const { error: rpcErr } = await supabaseAdmin.rpc('release_escrow_funds', {
        seller_id: item.seller_id,
        amount: payoutAmount
      });

      if (rpcErr) throw rpcErr;

      // Actualizar estado del ítem
      await supabaseAdmin
        .from('order_items')
        .update({ 
          status: 'completed', 
          payout_released: true 
        })
        .eq('id', item.id);

      console.log(`✅ Fondos del ítem ${item.id} liberados automáticamente al vendedor ${item.seller_id}`);
    } catch (err) {
      console.error(`❌ Error procesando ítem ${item.id}:`, err);
    }
  }

  console.log("🏁 Proceso de auto-release finalizado.");
}

// Ejecutar si se llama directamente
autoReleaseFunds();
