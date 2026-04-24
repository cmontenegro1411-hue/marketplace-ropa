import { supabaseAdmin } from "./supabase-admin";

/**
 * Procesa la liberación de fondos de Escrow para un ítem específico.
 * Cambia el estado a 'completed' y mueve el saldo de pending a available.
 * 
 * @param itemId ID del ítem en la tabla order_items
 */
export async function processEscrowRelease(itemId: string) {
  try {
    // 1. Obtener detalles del ítem usando el cliente admin
    const { data: item, error: fetchErr } = await supabaseAdmin
      .from('order_items')
      .select('id, seller_id, payout_amount, status, payout_released, price, products(title)')
      .eq('id', itemId)
      .single();

    if (fetchErr || !item) {
      console.error(`[Escrow] Item ${itemId} no encontrado o error en fetch:`, fetchErr);
      return { success: false, error: `Ítem ${itemId} no encontrado.` };
    }

    const productTitle = (item.products as any)?.title || 'Producto';

    // Solo procesar si está pendiente y no ha sido liberado
    if (item.status === 'completed') {
      return { success: true }; // Ya fue procesado exitosamente
    }

    if (item.status !== 'pending') {
      return { success: false, error: `El ítem ${itemId} no está en estado 'pending' (Estado actual: ${item.status}).` };
    }
    
    if (item.payout_released) {
      return { success: true }; // Ya fue liberado anteriormente
    }

    // El payout_amount debería estar pre-calculado en la creación de la orden (Precio - Comisiones)
    // Si por alguna razón es nulo, usamos un fallback seguro (ej: 85% del precio)
    const amount = item.payout_amount || (item.price * 0.85);

    if (amount <= 0) {
      return { success: false, error: `Monto inválido para liberación (S/ ${amount}).` };
    }

    // 2. Actualizar estado del ítem a 'completed'
    // Esto previene doble ejecución si el RPC tardara
    const { error: updateErr, count } = await supabaseAdmin
      .from('order_items')
      .update({ 
        status: 'completed', 
        received_at: new Date().toISOString(),
        payout_released: true 
      })
      .eq('id', itemId)
      .eq('status', 'pending');

    if (updateErr) {
      throw new Error(`Error al actualizar estado del ítem: ${updateErr.message}`);
    }

    if (count === 0) {
      // Si count es 0 significa que no se cumplió la condición .eq('status', 'pending')
      // Verificamos si es porque ya está completed
      const { data: currentItem } = await supabaseAdmin
        .from('order_items')
        .select('status')
        .eq('id', itemId)
        .single();

      if (currentItem?.status === 'completed') {
        return { success: true }; // Ya estaba procesado, lo consideramos éxito
      }
      
      return { success: false, error: "El pedido ya ha sido procesado o no está pendiente." };
    }

    // 3. Ejecutar RPC para mover los fondos en la tabla 'users'
    // Esta es una operación atómica dentro de PostgreSQL que ahora incluye auditoría
    const { error: rpcErr } = await supabaseAdmin.rpc('release_escrow_funds', {
      target_seller_id: item.seller_id,
      payout_amount: amount,
      ref_order_item_id: itemId,
      tx_description: `Venta: ${productTitle}`
    });

    if (rpcErr) {
      // Intento de Rollback del estado del ítem para permitir re-intento manual/automático
      console.error(`[Escrow Critical] RPC release_escrow_funds falló para item ${itemId}. Intentando rollback de estado.`);
      await supabaseAdmin
        .from('order_items')
        .update({ status: 'pending', payout_released: false })
        .eq('id', itemId);
      
      throw new Error(`Error en RPC de fondos: ${rpcErr.message}`);
    }

    console.log(`[Escrow Success] Fondos liberados para ítem ${itemId}. Vendedor: ${item.seller_id}. Monto: S/ ${amount}`);
    return { success: true };

  } catch (error: any) {
    console.error(`[Escrow Error] Fallo al procesar liberación del ítem ${itemId}:`, error.message);
    return { success: false, error: error.message };
  }
}
