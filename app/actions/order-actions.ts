'use server';


import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyConfirmToken } from "@/lib/order-tokens";
import { revalidatePath } from "next/cache";
import { sendEmail } from "@/lib/brevo";
import { processPartialRefund } from "@/lib/mercadopago";

import { processEscrowRelease } from "@/lib/orders";

/**
 * Acción para confirmar la recepción de un ítem por parte del comprador.
 * Esto libera los fondos al vendedor (pasa de pending a available).
 */
export async function confirmItemReception(token: string) {
  try {
    const decoded = verifyConfirmToken(token);
    if (!decoded) return { success: false, error: "Token inválido o expirado." };

    const { itemId } = decoded;

    const result = await processEscrowRelease(itemId);

    if (!result.success) {
      return result;
    }

    // Obtener el product_id para actualizar el estado del producto
    const { data: orderItem } = await supabaseAdmin
      .from('order_items')
      .select('product_id')
      .eq('id', itemId)
      .single();

    if (orderItem?.product_id) {
      await supabaseAdmin
        .from('products')
        .update({ 
          buyer_conformity: true,
          status: 'sold' 
        })
        .eq('id', orderItem.product_id);
    }

    revalidatePath(`/order/confirm/${token}`);
    revalidatePath('/');
    revalidatePath('/search');
    revalidatePath('/profile');
    revalidatePath('/dashboard/admin/vendedores');
    return { success: true };
  } catch (error: any) {
    console.error("confirmItemReception Error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Verifica el estado de un ítem por su token.
 */
export async function getOrderItemStatus(token: string) {
  try {
    const decoded = verifyConfirmToken(token);
    if (!decoded) return { success: false, error: "Token inválido o expirado." };

    const { itemId } = decoded;
    const { data: item, error } = await supabaseAdmin
      .from('order_items')
      .select('status, products(title, brand)')
      .eq('id', itemId)
      .single();

    if (error || !item) return { success: false, error: "No se encontró el pedido." };

    return { 
      success: true, 
      status: item.status,
      product: {
        title: (item.products as any).title,
        brand: (item.products as any).brand
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Registra una disputa por parte del comprador.
 * Congela los fondos y notifica a ambas partes.
 */
export async function disputeOrderItem(token: string) {
  try {
    const decoded = verifyConfirmToken(token);
    if (!decoded) return { success: false, error: "Token inválido." };

    const { itemId } = decoded;

    // Obtener detalles para los correos
    const { data: item, error: fetchErr } = await supabaseAdmin
      .from('order_items')
      .select('*, orders(buyer_name, buyer_email, buyer_phone), products(title, brand), sellers:users!seller_id(name, email, whatsapp_number)')
      .eq('id', itemId)
      .single();

    if (fetchErr) return { success: false, error: `Error al buscar el ítem: ${fetchErr.message}` };
    if (!item) return { success: false, error: "Ítem no encontrado." };
    if (item.status !== 'pending') return { success: false, error: "Ya existe una acción sobre este ítem." };

    // 1. Cambiar estado a disputed
    await supabaseAdmin
      .from('order_items')
      .update({ status: 'disputed' })
      .eq('id', itemId);

    const buyerInfo = (item.orders as any);
    const sellerInfo = (item.sellers as any);

    // 2. Notificar al Comprador (con info del Vendedor)
    await sendEmail({
      to: [{ email: buyerInfo.buyer_email, name: buyerInfo.buyer_name }],
      subject: `🛡️ Solicitud de Devolución Iniciada - ${item.products.title}`,
      htmlContent: `
        <h2>Hola ${buyerInfo.buyer_name}</h2>
        <p>Has iniciado una solicitud de devolución. El pago al vendedor ha sido <strong>congelado</strong>.</p>
        <p><strong>Instrucciones de Retorno:</strong></p>
        <ol>
          <li>Empaca la prenda cuidadosamente.</li>
          <li>Coordina el envío con el vendedor vía WhatsApp: <a href="https://wa.me/${sellerInfo.whatsapp_number}">${sellerInfo.whatsapp_number}</a></li>
          <li>Recuerda que el costo del envío corre por tu cuenta conforme a nuestras políticas.</li>
        </ol>
        <p>Una vez que el vendedor confirme la recepción, procesaremos tu reembolso automáticamente.</p>
      `
    });

    // 3. Notificar al Vendedor
    await sendEmail({
      to: [{ email: sellerInfo.email, name: sellerInfo.name }],
      subject: `⚠️ Venta en Disputa - Acción Requerida`,
      htmlContent: `
        <h2>Hola ${sellerInfo.name}</h2>
        <p>El comprador ha solicitado la devolución de <strong>${item.products.title}</strong>.</p>
        <p>El pago de S/ ${item.payout_amount} se encuentra retenido. El comprador se contactará contigo para devolverte la prenda.</p>
        <p><strong>Cuando recibas el producto y verifiques su estado, confirma la recepción aquí para cerrar el caso y reembolsar al comprador:</strong></p>
        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/order/confirm-return/${token}" 
           style="background: #cc3333; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
           Confirmar Retorno de Prenda
        </a>
      `
    });

    return { success: true };
  } catch (error: any) {
    console.error("disputeOrderItem Error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * El vendedor confirma que recibió la prenda de vuelta.
 * Se gatilla el reembolso automático vía Mercado Pago.
 */
export async function confirmReturnAndRefund(token: string) {
  try {
    const decoded = verifyConfirmToken(token);
    if (!decoded) return { success: false, error: "Token inválido." };

    const { itemId } = decoded;

    const { data: item, error: fetchErr } = await supabaseAdmin
      .from('order_items')
      .select('*, orders(mp_payment_id), products(title)')
      .eq('id', itemId)
      .single();

    if (fetchErr) return { success: false, error: `Error al recuperar el ítem: ${fetchErr.message}` };
    if (!item) return { success: false, error: "El ítem solicitado no existe." };
    if (item.status !== 'disputed') return { success: false, error: "El ítem no está en una disputa válida." };

    const paymentId = (item.orders as any).mp_payment_id;
    if (!paymentId) {
       return { success: false, error: "No se encontró el ID de pago de Mercado Pago para procesar el reembolso." };
    }

    // 1. Procesar REEMBOLSO en Mercado Pago (Monto del ítem)
    const refundResult = await processPartialRefund(paymentId, item.price);
    
    if (!refundResult.success) {
      return { success: false, error: `Error Mercado Pago: ${refundResult.error}` };
    }

    // 2. Actualizar estado en DB (Item)
    const { error: itemUpdateErr } = await supabaseAdmin
      .from('order_items')
      .update({ status: 'refunded', payout_released: false })
      .eq('id', itemId);

    if (itemUpdateErr) throw itemUpdateErr;

    // 3. Regresar producto a inventario (Disponible) y REVERTIR saldo del vendedor
    const { error: rpcErr } = await supabaseAdmin.rpc('revert_escrow_funds', {
      target_seller_id: item.seller_id,
      payout_to_revert: item.payout_amount,
      ref_order_item_id: itemId,
      tx_description: `Devolución: Prenda retornada y reembolso procesado (${item.products.title})`
    });

    if (rpcErr) {
      console.error("[Escrow] Error revert_escrow_funds en devolución:", rpcErr.message);
    }

    const { error: productUpdateErr } = await supabaseAdmin
      .from('products')
      .update({ 
        status: 'available',
        buyer_name: null,
        buyer_phone: null,
        buyer_email: null
      })
      .eq('id', item.product_id);

    if (productUpdateErr) {
      console.warn("No se pudo actualizar el estado del producto, pero el reembolso y reversión fueron procesados.", productUpdateErr);
    }

    // 4. Sincronizar estado de la Orden Global
    const { data: allItems } = await supabaseAdmin
      .from('order_items')
      .select('status')
      .eq('order_id', item.order_id);

    const allRefunded = allItems?.every(i => i.status === 'refunded');
    if (allRefunded) {
      await supabaseAdmin
        .from('orders')
        .update({ payment_status: 'refunded' })
        .eq('id', item.order_id);
    }
    
    return { success: true };
  } catch (error: any) {
    console.error("confirmReturnAndRefund Error:", error);
    return { success: false, error: error.message };
  }
}
