import { supabaseAdmin } from '@/lib/supabase-admin';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { sendEmail } from '@/lib/brevo';
import { NextRequest, NextResponse } from 'next/server';
import { generateConfirmToken } from '@/lib/order-tokens';

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const dataId = searchParams.get('data.id');

    if (type === 'payment' && dataId) {
      const client = new MercadoPagoConfig({ 
        accessToken: process.env.MP_ACCESS_TOKEN || '' 
      });
      const payment = new Payment(client);

      const paymentData = await payment.get({ id: dataId });

      if (paymentData.status === 'approved') {
        const metadata = paymentData.external_reference ? JSON.parse(paymentData.external_reference) : {};
        const { productIds } = metadata;

        console.log(`[Webhook MP] Pago Aprobado: ${dataId}. Productos:`, productIds);

        if (productIds && productIds.length > 0) {
          // 1. Actualizar productos a 'sold' y asignar comprador info del pago
          const { error: prodUpdateError } = await supabaseAdmin
            .from('products')
            .update({ 
               status: 'sold',
               buyer_email: paymentData.payer?.email,
               buyer_name: `${paymentData.payer?.first_name || ''} ${paymentData.payer?.last_name || ''}`.trim() || 'Comprador MP'
            })
            .in('id', productIds);

          if (prodUpdateError) {
            console.error("[Webhook MP] Error actualizando productos:", prodUpdateError);
          }

          // 3. OBTENER DETALLES EXTENDIDOS (Para Escrow y correos)
          const { data: fullProducts, error: fullProdError } = await supabaseAdmin
            .from('products')
            .select('id, title, price, brand, seller_id, users!inner(email, name, whatsapp_number)')
            .in('id', productIds);

          if (fullProdError) {
            console.error("[Webhook MP] Error obteniendo detalles de productos:", fullProdError);
          }

          // 2. Registrar/Actualizar Orden
          const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .insert({
              payment_status: 'completed',
              total_amount: paymentData.transaction_amount,
              mp_application_fee: (paymentData as any).marketplace_fee || (paymentData as any).fee_details?.find((f: any) => f.type === 'application_fee')?.amount || 0,
              buyer_email: paymentData.payer?.email,
              items: productIds
            })
            .select()
            .single();

          if (orderError) {
            console.error("[Webhook MP] Error insertando orden:", orderError);
          }

          if (order) {
             // --- CÁLCULO DE COMISIONES (10% Plataforma + Fees MP) ---
             const totalPaid = paymentData.transaction_amount || 0;
             const totalMpFees = (paymentData as any).fee_details?.reduce((acc: number, fee: any) => {
               // Sumamos los fees que cobra MP (no incluimos application_fee si lo hubiera porque ese es nuestro)
               if (fee.type === 'mercadopago_fee' || fee.fee_payer === 'collector') return acc + (fee.amount || 0);
               return acc;
             }, 0) || 0;

             // 🟢 REGISTRAR ITEMS EN ESTADO PENDIENTE (FIDEICOMISO)
             const itemsToInsert = fullProducts?.map(p => {
               const itemProportion = p.price / totalPaid;
               const itemMpFee = totalMpFees * itemProportion;
               const itemPlatformComm = p.price * 0.10;
               const itemPayout = p.price - itemPlatformComm - itemMpFee;

               return {
                 order_id: order.id,
                 product_id: p.id,
                 seller_id: p.seller_id,
                 price: p.price,
                 payout_amount: Number(itemPayout.toFixed(2)),
                 status: 'pending'
               };
             });

             if (itemsToInsert && itemsToInsert.length > 0) {
                // Primero eliminamos los items vacíos creados inicialmente si los hubiera
                await supabaseAdmin.from('order_items').delete().eq('order_id', order.id);
                // Insertamos los completos para el flujo de Escrow
                const { data: savedItems, error: insertError } = await supabaseAdmin
                  .from('order_items')
                  .insert(itemsToInsert)
                  .select();

                if (!insertError && savedItems) {
                  // 💰 CAPTURAR FONDOS EN BILLETERA (Escrow)
                  // Invocamos el RPC para cada item para tener auditoría detallada
                  for (const item of savedItems) {
                    const productTitle = fullProducts?.find(p => p.id === item.product_id)?.title || 'Producto';
                    await supabaseAdmin.rpc('capture_escrow_funds', {
                      target_seller_id: item.seller_id,
                      payout_amount: item.payout_amount,
                      ref_order_id: order.id,
                      ref_order_item_id: item.id,
                      tx_description: `Captura Escrow: ${productTitle} (Neto: S/ ${item.payout_amount})`
                    });
                  }
                }
             }
          }

          if (fullProducts && fullProducts.length > 0) {
            const buyerEmail = paymentData.payer?.email;
            const buyerName = `${paymentData.payer?.first_name || ''} ${paymentData.payer?.last_name || ''}`.trim() || 'Comprador';

            // --- A. Email al Comprador (Resumen de Pago) ---
            if (buyerEmail) {
              const itemsWithTokens = [];
              for (const p of fullProducts) {
                const { data: savedItem } = await supabaseAdmin
                  .from('order_items')
                  .select('id')
                  .eq('product_id', p.id)
                  .eq('order_id', order?.id || '')
                  .single();
                
                const token = savedItem ? generateConfirmToken(savedItem.id, order!.id) : '';
                itemsWithTokens.push({ ...p, token });
              }

              const itemsHtml = itemsWithTokens.map(p => {
                return `
                  <li style="margin-bottom: 20px; padding: 15px; border-left: 4px solid #D4A373; background: #fff; border-radius: 8px;">
                    <strong>${p.brand || ''} ${p.title}</strong> - S/ ${p.price}<br/>
                    <div style="margin-top: 12px; display: flex; gap: 10px;">
                      <div style="display: inline-block; vertical-align: top; width: 45%;">
                        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/order/confirm/${p.token}" 
                           style="display: inline-block; background: #2F3C2C; color: white; padding: 8px 15px; text-decoration: none; border-radius: 20px; font-size: 11px; font-weight: bold; text-transform: uppercase;">Confirmar Recibido</a>
                        <p style="margin: 5px 0 0 0; font-size: 9px; color: #666; line-height: 1.2;">Usa esta opción si ya tienes tu prenda y todo está perfecto. Libera el pago al vendedor.</p>
                      </div>
                      <div style="display: inline-block; vertical-align: top; width: 45%; margin-left: 5%;">
                        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/order/refund-request/${p.token}" 
                           style="display: inline-block; color: #cc3333; font-size: 11px; text-decoration: underline; font-weight: bold; text-transform: uppercase;">Solicitar Devolución</a>
                        <p style="margin: 5px 0 0 0; font-size: 9px; color: #cc3333; line-height: 1.2;">¿El producto no es lo que esperabas? Bloquea el pago aquí para gestionar la devolución.</p>
                      </div>
                    </div>
                  </li>
                `;
              }).join('');

              await sendEmail({
                to: [{ email: buyerEmail, name: buyerName }],
                subject: `✅ ¡Pago confirmado! Tu pedido en Moda Circular`,
                htmlContent: `
                  <div style="font-family: serif; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0dcd0; border-radius: 20px;">
                    <h1 style="color: #4a5d4e; text-align: center;">¡Gracias por tu compra!</h1>
                    <p>Hola <strong>${buyerName}</strong>, tu pago ha sido procesado con éxito.</p>
                    <div style="background: #fdfaf6; padding: 20px; border-radius: 15px; margin: 20px 0;">
                      <h3 style="margin-top: 0; color: #4a5d4e;">Resumen del Pedido:</h3>
                      <ul style="padding-left: 0; list-style: none;">
                        ${itemsHtml}
                      </ul>
                      <p style="font-size: 18px; font-weight: bold; border-top: 1px solid #e0dcd0; pt: 10px;">Total Pago: S/ ${paymentData.transaction_amount}</p>
                    </div>
                    <p style="font-size: 14px; color: #666;">Tu dinero está seguro en <strong>fideicomiso</strong>. Solo lo liberaremos al vendedor una vez que confirmes que recibiste tu prenda en perfecto estado.</p>
                    <p style="text-align: center; margin-top: 30px; font-size: 12px; color: #999;">Equipo de Moda Circular Luxury</p>
                  </div>
                `
              }).catch(e => console.error("[Webhook Email Buyer Error]:", e));
            }

            // --- B. Emails a los Vendedores (Uno por cada seller_id único) ---
            const sellersMap = new Map();
            fullProducts.forEach(p => {
              if (!sellersMap.has(p.seller_id)) {
                sellersMap.set(p.seller_id, {
                  email: (p as any).users.email,
                  name: (p as any).users.name,
                  items: []
                });
              }
              sellersMap.get(p.seller_id).items.push(p);
            });

            for (const [sellerId, sellerInfo] of Array.from(sellersMap.entries())) {
              if (sellerInfo.email) {
                const sellerItemsHtml = sellerInfo.items.map((p: any) => `<li>${p.title} - S/ ${p.price}</li>`).join('');
                const sellerTotal = sellerInfo.items.reduce((sum: number, p: any) => sum + p.price, 0);

                await sendEmail({
                  to: [{ email: sellerInfo.email, name: sellerInfo.name }],
                  subject: `🔔 ¡Venta Realizada! Has vendido ${sellerInfo.items.length} prenda(s)`,
                  htmlContent: `
                    <div style="font-family: serif; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0dcd0; border-radius: 20px;">
                      <h2 style="color: #4a5d4e;">¡Felicidades, ${sellerInfo.name}!</h2>
                      <p>Has realizado una venta exitosa en <strong>Moda Circular</strong>.</p>
                      <div style="background: #fdfaf6; padding: 15px; border-radius: 10px; margin: 20px 0;">
                        <strong>Prendas vendidas:</strong>
                        <ul style="margin: 10px 0; padding-left: 20px;">${sellerItemsHtml}</ul>
                        <p><strong>Total Bruto:</strong> S/ ${sellerTotal.toFixed(2)}</p>
                      </div>
                      <p><strong>Próximos pasos:</strong></p>
                      <ol style="font-size: 14px; line-height: 1.6;">
                        <li>Prepara el paquete con el cuidado habitual.</li>
                        <li>Realiza el envío al comprador: <strong>${buyerName}</strong> (${buyerEmail || 'Ver en panel'}).</li>
                        <li>Ingresa a tu <strong>Perfil > Mi Inventario</strong> y marca la prenda como <strong>"Enviada"</strong> para notificar al comprador y agilizar la liberación de tus fondos.</li>
                      </ol>
                      <div style="text-align: center; margin-top: 30px;">
                        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/profile" style="background-color: #4a5d4e; color: #fdfaf6; padding: 12px 25px; text-decoration: none; border-radius: 25px; font-weight: bold;">IR A MI INVENTARIO</a>
                      </div>
                    </div>
                  `
                }).catch(e => console.error(`[Webhook Email Seller ${sellerId} Error]:`, e));
              }
            }
          }
          
          console.log(`[Webhook MP] Pago ${dataId} procesado y notificaciones enviadas.`);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('[Webhook MP Error]:', error);
    // Respondemos 200 para evitar que MP reintente infinitamente si es un error de nuestra lógica interna post-pago
    return NextResponse.json({ error: error.message }, { status: 200 });
  }
}
