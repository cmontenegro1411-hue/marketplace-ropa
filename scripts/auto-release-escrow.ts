import { supabaseAdmin } from "../lib/supabase-admin.js";
import { processEscrowRelease } from "../lib/orders";

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
    .select('id')
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
      // Usamos la lógica centralizada para asegurar consistencia en auditoría y descripciones
      const result = await processEscrowRelease(item.id);

      if (result.success) {
        console.log(`✅ Fondos del ítem ${item.id} liberados satisfactoriamente.`);
      } else {
        console.error(`❌ Error al liberar ítem ${item.id}:`, result.error);
      }
    } catch (err) {
      console.error(`❌ Error inesperado procesando ítem ${item.id}:`, err);
    }
  }

  console.log("🏁 Proceso de auto-release finalizado.");
}

// Ejecutar si se llama directamente
autoReleaseFunds();
