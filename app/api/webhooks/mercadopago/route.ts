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
        const { 
          productIds, 
          userId,
          shippingFee = 0,
          shippingName,
          shippingAddress,
          shippingUbigeo,
          shippingDepartment,
          shippingProvince,
          shippingDistrict,
          shippingPhone
        } = metadata;

        console.log(`[Webhook MP] Pago Aprobado: ${dataId}. Productos:`, productIds);

        if (productIds && productIds.length > 0) {
          // 1. Actualizar productos a 'sold' y asignar comprador info del pago + envío
          const { error: prodUpdateError } = await supabaseAdmin
            .from('products')
            .update({ 
               status: 'reserved',
               buyer_email: paymentData.payer?.email,
               buyer_name: `${paymentData.payer?.first_name || ''} ${paymentData.payer?.last_name || ''}`.trim() || 'Comprador MP',
               shipping_address: shippingAddress,
               shipping_ubigeo: shippingUbigeo,
               shipping_cost: Number((shippingFee / productIds.length).toFixed(2)) // Prorrateado para reportes si es necesario, aunque lo ideal es que el total coincida
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

          const sellersInOrder = fullProducts ? [...new Set(fullProducts.map(p => p.seller_id))] : [];

          // 2. Registrar/Actualizar Orden con datos de ENVÍO
          const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .insert({
              payment_status: 'completed',
              total_amount: paymentData.transaction_amount,
              mp_payment_id: dataId,
              mp_application_fee: (paymentData as any).marketplace_fee || (paymentData as any).fee_details?.find((f: any) => f.type === 'application_fee')?.amount || 0,
              buyer_email: paymentData.payer?.email,
              buyer_id: userId === 'guest' ? null : userId,
              items: productIds,
              // Nuevos campos de envío
              shipping_name: shippingName,
              shipping_phone: shippingPhone,
              shipping_department: shippingDepartment,
              shipping_province: shippingProvince,
              shipping_district: shippingDistrict,
              shipping_ubigeo: shippingUbigeo,
              shipping_address: shippingAddress,
              shipping_fee: shippingFee
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
               if (fee.type === 'mercadopago_fee' || fee.fee_payer === 'collector') return acc + (fee.amount || 0);
               return acc;
             }, 0) || 0;

             // 🟢 REGISTRAR ITEMS EN ESTADO PENDIENTE (FIDEICOMISO)
             // Agrupamos por vendedor para asignar el shipping_fee al primer item de cada vendedor
             
             const itemsToInsert = [];
             for (const sId of sellersInOrder) {
               const sellerProducts = fullProducts!.filter(p => p.seller_id === sId);
               // Nota: En el checkout actual sumamos los envíos de cada vendedor.
               // Para simplificar aquí, asumimos que si hay shippingFee > 0, es la suma de lo que toca a cada uno.
               // Idealmente la metadata debería traer el desglose por seller si hay varios.
               // Por ahora, si es un solo vendedor, le damos todo el shippingFee.
               const isSingleSeller = sellersInOrder.length === 1;
               const currentSellerShipping = isSingleSeller ? shippingFee : 0; // TODO: Mejorar desglose multiseller

               for (let i = 0; i < sellerProducts.length; i++) {
                 const p = sellerProducts[i];
                 const itemProportion = p.price / totalPaid;
                 const itemMpFee = totalMpFees * itemProportion;
                 const itemPlatformComm = p.price * 0.10;
                 
                 // El pago al vendedor es: Precio del Producto - Comisión - Fee MP + Envío (si es el primer item del seller)
                 const itemShipping = i === 0 ? currentSellerShipping : 0;
                 const itemPayout = p.price - itemPlatformComm - itemMpFee + itemShipping;

                 itemsToInsert.push({
                   order_id: order.id,
                   product_id: p.id,
                   seller_id: p.seller_id,
                   price: p.price,
                   payout_amount: Number(itemPayout.toFixed(2)),
                   status: 'pending'
                 });
               }
             }

             if (itemsToInsert.length > 0) {
                await supabaseAdmin.from('order_items').delete().eq('order_id', order.id);
                const { data: savedItems, error: insertError } = await supabaseAdmin
                  .from('order_items')
                  .insert(itemsToInsert)
                  .select();

                if (!insertError && savedItems) {
                  for (const item of savedItems) {
                    const product = fullProducts?.find(p => p.id === item.product_id);
                    const fullTitle = product ? `${product.brand || ''} ${product.title}`.trim() : 'Producto';
                    await supabaseAdmin.rpc('capture_escrow_funds', {
                      target_seller_id: item.seller_id,
                      payout_amount: item.payout_amount,
                      ref_order_id: order.id,
                      ref_order_item_id: item.id,
                      tx_description: `Venta: ${fullTitle}`
                    });

                    const itemPlatformComm = item.price * 0.10;
                    await supabaseAdmin.from('platform_revenue').insert({
                      amount: Number(itemPlatformComm.toFixed(2)),
                      type: 'sales_commission',
                      user_id: item.seller_id,
                      reference_id: order.id,
                      metadata: { 
                        product_id: item.product_id, 
                        order_item_id: item.id,
                        price: item.price 
                      }
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
              const itemsHtml = fullProducts.map(p => {
                return `
                  <li style="margin-bottom: 20px; padding: 15px; border-left: 4px solid #D4A373; background: #fff; border-radius: 8px;">
                    <strong>${p.brand || ''} ${p.title}</strong> - S/ ${p.price}<br/>
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
                        <li style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed #D4A373;">
                          <strong>Envío:</strong> S/ ${shippingFee.toFixed(2)}
                        </li>
                      </ul>
                      <p style="font-size: 18px; font-weight: bold; border-top: 1px solid #e0dcd0; pt: 10px;">Total Pago: S/ ${paymentData.transaction_amount}</p>
                    </div>
                    <div style="background: #fff; padding: 15px; border: 1px solid #eee; border-radius: 10px;">
                      <strong>Dirección de Entrega:</strong><br/>
                      ${shippingAddress}<br/>
                      ${shippingDistrict}, ${shippingProvince}, ${shippingDepartment}
                    </div>
                    <p style="font-size: 14px; color: #666; margin-top: 20px;">Tu dinero está seguro en <strong>fideicomiso</strong>. Solo lo liberaremos al vendedor una vez que confirmes que recibiste tu prenda.</p>
                  </div>
                `
              }).catch(e => console.error("[Webhook Email Buyer Error]:", e));
            }

            // --- B. Emails a los Vendedores ---
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
                const sellerShipping = sellersInOrder.length === 1 ? shippingFee : 0;

                await sendEmail({
                  to: [{ email: sellerInfo.email, name: sellerInfo.name }],
                  subject: `🔔 ¡Venta Realizada! Prepara tu envío para ${buyerName}`,
                  htmlContent: `
                    <div style="font-family: serif; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0dcd0; border-radius: 20px;">
                      <h2 style="color: #4a5d4e;">¡Felicidades, ${sellerInfo.name}!</h2>
                      <p>Has realizado una venta exitosa.</p>
                      <div style="background: #fdfaf6; padding: 15px; border-radius: 10px; margin: 20px 0;">
                        <strong>Datos de Envío:</strong><br/>
                        Destinatario: ${shippingName}<br/>
                        Teléfono: ${shippingPhone}<br/>
                        Dirección: ${shippingAddress}<br/>
                        Ubigeo: ${shippingDistrict}, ${shippingProvince}, ${shippingDepartment}
                      </div>
                      <div style="background: #fff; padding: 15px; border: 1px solid #eee; border-radius: 10px; margin: 20px 0;">
                        <strong>Resumen Financiero:</strong><br/>
                        Productos: S/ ${sellerTotal.toFixed(2)}<br/>
                        Envío recolectado: S/ ${sellerShipping.toFixed(2)}<br/>
                        <small>Tu pago final (Escrow) incluirá el monto del envío para que gestiones el courier.</small>
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
