'use server';

import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
// import { sendEmail } from '@/lib/brevo'; // Movido a importación dinámica dentro de acciones para evitar ciclos de build
import { generateConfirmToken, verifyConfirmToken } from "@/lib/order-tokens";


export async function createListing(formData: any) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return { success: false, error: "No autorizado. Inicie sesión." };
    }



    const { data, error } = await supabase
      .from('products')
      .insert([
        {
          title: formData.title,
          brand: formData.brand,
          size: formData.size,
          category: formData.category, // Usamos singular para máxima estabilidad
          description: formData.description,
          condition: formData.condition,
          price: formData.price,
          seller_id: session.user.id,
          images: formData.images || [],
          ai_usage_type: formData.aiUsageType || 'free',
          ai_on_demand_charge: formData.aiUsageType === 'on_demand'
        }
      ])
      .select();

    if (error) {
       console.error("Supabase Inner Error:", error);
       return { success: false, error: error.message }; 
    }
    
    revalidatePath('/');
    revalidatePath('/search');
    

    return { success: true, product: data[0] };
  } catch (error: any) {
    console.error("Supabase Action Error:", error);
    return { success: false, error: error.message || "Error inesperado" };
  }
}

export async function deleteListing(productId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "No autorizado" };

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)
      .eq('seller_id', session.user.id); // Seguridad: solo borras lo tuyo

    if (error) throw error;
    
    revalidatePath('/profile');
    revalidatePath('/search');

    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateListing(productId: string, formData: any) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return { success: false, error: "No autorizado. Inicie sesión." };
    }

    // 1. Verificar propiedad antes de actualizar
    const { data: existing } = await supabase
      .from('products')
      .select('seller_id')
      .eq('id', productId)
      .single();

    if (!existing || existing.seller_id !== session.user.id) {
      return { success: false, error: "No tienes permiso para editar este producto." };
    }

    // 2. Aplicar actualización
    const { data, error } = await supabase
      .from('products')
      .update({
        title: formData.title,
        brand: formData.brand,
        size: formData.size,
        category: formData.category,
        description: formData.description,
        condition: formData.condition,
        price: Number(formData.price),
        images: formData.images || [],
      })
      .eq('id', productId)
      .select();

    if (error) {
       console.error("Supabase Update Error:", error);
       return { success: false, error: error.message }; 
    }
    
    revalidatePath('/');
    revalidatePath('/search');
    revalidatePath(`/products/${productId}`);
    revalidatePath('/profile');
    
    return { success: true, product: data[0] };
  } catch (error: any) {
    console.error("Supabase Update Action Error:", error);
    return { success: false, error: error.message || "Error inesperado" };
  }
}

/**
 * Marca todos los productos del carrito como 'sold' en Supabase.
 * Se llama desde el checkout al confirmar la compra ficticia.
 */
export async function completePurchase(productIds: string[], formData: any, shippingFee: number = 0) {
  let orderRecord: any = null;
  let contactInfo: any[] = [];
  let availableIds: string[] = [];
  const session = await auth();
  try {
    if (!productIds || productIds.length === 0) {
      return { success: false, error: "No hay productos en el carrito." };
    }

    // VALIDACIÓN DE DATOS DEL COMPRADOR
    if (!formData.name || formData.name.trim().length === 0) {
      return { success: false, error: "El nombre es obligatorio." };
    }
    if (!formData.email || !formData.email.includes('@')) {
      return { success: false, error: "El email es inválido." };
    }
    if (!formData.buyer_phone || formData.buyer_phone.trim().length < 7) {
      return { success: false, error: "El número de contacto es inválido." };
    }

    // CAPA DE SEGURIDAD: Verificar que TODOS los productos aún estén disponibles
    const { data: products, error: checkError } = await supabaseAdmin
      .from('products')
      .select('id, title, brand, status, seller_id, price')
      .in('id', productIds);

    if (checkError) {
      console.error("[CompletePurchase] Error verificando disponibilidad:", checkError);
      return { success: false, error: "Error verificando disponibilidad de productos." };
    }

    const alreadySold = products?.filter(p => p.status === 'sold') || [];
    if (alreadySold.length > 0) {
      const names = alreadySold.map(p => p.title).join(', ');
      return { 
        success: false, 
        error: `Los siguientes productos ya fueron vendidos: ${names}. Por favor retíralos del carrito.`
      };
    }

    // Solo actualizar los que están disponibles (doble check)
    availableIds = products?.filter(p => p.status !== 'sold').map(p => p.id) || [];

    // Recalcular costos de envío por producto (o mejor por seller) para persistir
    const sellerIds = [...new Set(products!.map(p => p.seller_id))];
    const { data: sellersData } = await supabaseAdmin
      .from('users')
      .select('id, ubigeo_code, shipping_rates, name, email, whatsapp_number')
      .in('id', sellerIds);

    // Calcular costos por vendedor
    const sellerShippingCosts: Record<string, number> = {};
    sellersData?.forEach(s => {
      // Normalizar ubigeos
      const sellerUbigeo = s.ubigeo_code?.toString().trim().padStart(6, '0');
      const buyerUbigeo = formData.shipping_ubigeo?.toString().trim().padStart(6, '0');
      
      console.log(`[Shipping Server Debug] Seller: ${s.id}, Seller Ubigeo: ${sellerUbigeo}, Buyer Ubigeo: ${buyerUbigeo}`);
      const rates = (s.shipping_rates as any);
      const defaultRates = { local: 10, regional: 15, national: 25 };

      let fee = 0;
      
      if (!sellerUbigeo || sellerUbigeo === '000000') {
        fee = (rates?.national !== undefined && rates?.national !== null) ? Number(rates.national) : defaultRates.national;
      } else if (sellerUbigeo === buyerUbigeo) {
        // MISMO DISTRITO
        fee = (rates?.local !== undefined && rates?.local !== null) ? Number(rates.local) : defaultRates.local;
      } else if (sellerUbigeo.substring(0, 2) === buyerUbigeo.substring(0, 2)) {
        // MISMO DEPARTAMENTO
        fee = (rates?.regional !== undefined && rates?.regional !== null) ? Number(rates.regional) : defaultRates.regional;
      } else {
        // DIFERENTE DEPARTAMENTO (NACIONAL)
        fee = (rates?.national !== undefined && rates?.national !== null) ? Number(rates.national) : defaultRates.national;
      }
      
      sellerShippingCosts[s.id] = Number(fee);
    });

    // Actualizar productos uno por uno para asignar su costo de envío (dividido entre items del mismo seller si fuera el caso, 
    // pero usualmente se cobra por 'paquete' del mismo vendedor. Aquí simplificaremos: el primer item del seller lleva el costo)
    for (const sId of sellerIds) {
      const sellerProducts = availableIds.filter(id => products!.find(p => p.id === id)?.seller_id === sId);
      const shippingCost = sellerShippingCosts[sId] || 0;

      // El primer producto del vendedor carga con el costo de envío en la BD para reportes
      const { error: updErr1 } = await supabaseAdmin.from('products').update({ 
        status: 'reserved',
        buyer_name: formData.name,
        buyer_phone: formData.buyer_phone,
        buyer_email: formData.email,
        shipping_address: formData.shipping_address,
        shipping_ubigeo: formData.shipping_ubigeo,
        shipping_cost: Number(shippingCost.toFixed(2))
      }).eq('id', sellerProducts[0]);
      if (updErr1) console.error(`[CompletePurchase] Error actualizando producto ${sellerProducts[0]}:`, updErr1);

      // Los demás productos del mismo vendedor (si hay) se marcan sin costo extra de envío duplicado
      if (sellerProducts.length > 1) {
        const { error: updErr2 } = await supabaseAdmin.from('products').update({ 
          status: 'reserved',
          buyer_name: formData.name,
          buyer_phone: formData.buyer_phone,
          buyer_email: formData.email,
          shipping_address: formData.shipping_address,
          shipping_ubigeo: formData.shipping_ubigeo,
          shipping_cost: 0 
        }).in('id', sellerProducts.slice(1));
        if (updErr2) console.error(`[CompletePurchase] Error actualizando productos adicionales:`, updErr2);
      }
    }

    // Revalidar todas las páginas que muestran productos
    revalidatePath('/');
    revalidatePath('/search');
    revalidatePath('/profile');
    revalidatePath('/profile/settings');
    for (const id of availableIds) {
      revalidatePath(`/products/${id}`);
    }

    // 🟢 REGISTRAR LA ORDEN EN SUPABASE
    const totalOrder = products!.reduce((sum, p) => sum + p.price, 0);
    const orderItemsSummary = products!.map(p => ({ title: p.title, brand: p.brand, price: p.price }));
    
    const { data: createdOrder, error: orderErr } = await supabaseAdmin
      .from('orders')
      .insert({
        buyer_id: session?.user?.id || null,
        buyer_name: formData.name,
        buyer_email: formData.email,
        buyer_phone: formData.buyer_phone,
        total_amount: totalOrder,
        items: orderItemsSummary,
        // Nuevos campos de envío
        shipping_name: formData.shipping_name || formData.name,
        shipping_phone: formData.shipping_phone || formData.buyer_phone,
        shipping_department: formData.shipping_department,
        shipping_province: formData.shipping_province,
        shipping_district: formData.shipping_district,
        shipping_ubigeo: formData.shipping_ubigeo,
        shipping_address: formData.shipping_address,
        shipping_fee: shippingFee,
        payment_status: 'completed' 
      })
      .select('id')
      .single();

    if (orderErr) {
       console.error('[Orders DB] ❌ Error al guardar orden en Supabase:', orderErr.message);
       return { success: false, error: "Error al registrar la orden. Por favor intenta de nuevo." };
    } else if (createdOrder) {
       orderRecord = createdOrder;
       console.log(`[Orders DB] ✅ Orden registrada con ID: ${orderRecord.id}`);
       // 🟢 REGISTRAR ITEMS INDIVIDUALES Y CAPTURAR FONDOS EN ESCROW
       for (const p of products!) {
         const payoutAmount = p.price * 0.90; 
         
         const { data: itemRecord, error: itemErr } = await supabaseAdmin
           .from('order_items')
           .insert({
             order_id: orderRecord.id,
             product_id: p.id,
             seller_id: p.seller_id,
             price: p.price,
             payout_amount: payoutAmount,
             status: 'pending'
           })
           .select('id')
           .single();

         if (itemErr) {
           console.error(`[Orders DB] ❌ Error insertando order_item para producto ${p.id}:`, itemErr.message);
         } else if (itemRecord) {
           const { error: rpcErr } = await supabaseAdmin.rpc('capture_escrow_funds', {
             target_seller_id: p.seller_id,
             payout_amount: payoutAmount,
             ref_order_id: orderRecord.id,
             ref_order_item_id: itemRecord.id,
             tx_description: `Venta: ${p.brand} ${p.title}`
           });
           if (rpcErr) console.error(`[Escrow] ❌ Error en capture_escrow_funds:`, rpcErr.message);
         }
       }

       // 🟢 NOTIFICACIONES POR CORREO (SOLO SI LA ORDEN EXISTE)
       const { sendEmail } = await import('@/lib/brevo');
       const { generateConfirmToken } = await import('@/lib/order-tokens');
       const emailPromises = [];

       if (sellersData) {
         for (const seller of sellersData) {
           const sellerProducts = products!.filter(p => p.seller_id === seller.id);
           const totalProductsAmount = sellerProducts.reduce((sum, p) => sum + p.price, 0);
           const shippingAmount = sellerShippingCosts[seller.id] || 0;
           const totalGross = totalProductsAmount + shippingAmount;
           
           contactInfo.push({
             sellerId: seller.id,
             sellerName: seller.name || 'Vendedor',
             whatsapp: seller.whatsapp_number,
             productCount: sellerProducts.length,
             totalAmount: totalProductsAmount,
             shippingAmount: shippingAmount,
             productsList: sellerProducts.map(p => p.title).join(', ')
           });

           // 🟢 NOTIFICAR AL VENDEDOR POR CORREO
           if (seller.email) {
             const productNames = sellerProducts.map(p => `<li>${p.title} - S/ ${p.price}</li>`).join('');
             emailPromises.push(sendEmail({
               to: [{ email: seller.email, name: seller.name || 'Vendedor' }],
               subject: `🔔 ¡Venta realizada! Pago asegurado por ${sellerProducts.length} prenda(s)`,
               htmlContent: `
                 <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
                   <h2 style="color: #2F3C2C; border-bottom: 2px solid #F4F1EB; padding-bottom: 10px;">¡Felicidades, ${seller.name || 'Vendedor'}!</h2>
                   <p>Has realizado una venta exitosa en <strong>Moda Circular</strong>. El pago del comprador ya ha sido procesado y se encuentra <strong>asegurado en fideicomiso</strong>.</p>
                   
                   <div style="background: #F9F7F2; padding: 15px; border-radius: 8px; margin: 20px 0;">
                     <h3 style="margin-top: 0; font-size: 16px;">Detalle de la transacción:</h3>
                     <ul style="padding-left: 20px;">
                       ${productNames}
                     </ul>
                     <div style="border-top: 1px solid #ddd; padding-top: 10px; margin-top: 10px;">
                       <p style="margin: 5px 0;">Subtotal Prendas: S/ ${totalProductsAmount.toFixed(2)}</p>
                       <p style="margin: 5px 0;">Costo de Envío: S/ ${shippingAmount.toFixed(2)}</p>
                       <p style="margin: 10px 0 0 0; font-weight: bold; font-size: 16px;">Total Bruto: S/ ${totalGross.toFixed(2)}</p>
                     </div>
                     <p style="font-size: 11px; color: #666; margin-top: 10px;">(Tus ganancias netas se calcularán sobre el precio de las prendas menos la comisión del 10%)</p>
                   </div>

                   <div style="border-left: 4px solid #D4A373; padding-left: 15px; margin: 20px 0;">
                     <h3 style="margin-top: 0; font-size: 16px;">Datos del Comprador (Envío):</h3>
                     <p style="margin: 5px 0;"><strong>Destinatario:</strong> ${formData.shipping_name || formData.name}</p>
                     <p style="margin: 5px 0;"><strong>Dirección:</strong> ${formData.shipping_address}, ${formData.shipping_district}, ${formData.shipping_province}, ${formData.shipping_department}</p>
                     <p style="margin: 5px 0;"><strong>WhatsApp Destinatario:</strong> ${formData.shipping_phone || formData.buyer_phone}</p>
                   </div>

                   <p style="font-size: 14px; color: #666; line-height: 1.5;">
                     <strong>Próximo paso obligatorio:</strong> Prepara el paquete y realiza el envío a la brevedad. 
                     Una vez enviado, ingresa a tu perfil y marca la prenda como <strong>"Enviada"</strong> para notificar al comprador.
                     Tus fondos se liberarán automáticamente cuando el comprador confirme la recepción conforme.
                   </p>
                   
                   <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
                   <p style="font-size: 11px; color: #999; text-align: center;">Este es un mensaje automático de Moda Circular Luxury.</p>
                 </div>
               `
             }).catch(err => console.error(`Error enviando notificación al vendedor ${seller.id}:`, err)));
           }
         }
       }

       // 🟢 NOTIFICAR AL COMPRADOR POR CORREO
       if (formData.email) {
         const { data: savedItems } = await supabaseAdmin
           .from('order_items')
           .select('id, product_id')
           .eq('order_id', orderRecord.id);

         const itemsWithTokens = products!.map(p => {
           const orderItemId = savedItems?.find(si => si.product_id === p.id)?.id;
           const token = orderItemId ? generateConfirmToken(orderItemId, orderRecord.id) : '';
           return { ...p, token };
         });

         const allProductsList = itemsWithTokens.map(p => `
           <li style="margin-bottom: 20px; padding: 15px; border-left: 4px solid #D4A373; background: #fff; border-radius: 8px;">
             <strong>${p.brand || ''} ${p.title}</strong> - S/ ${p.price}<br/>
             <p style="font-size: 11px; color: #666; margin-top: 8px;">
               Te enviaremos los enlaces para confirmar la recepción una vez que el vendedor marque el producto como enviado.
             </p>
           </li>
         `).join('');

         const finalTotalWithShipping = totalOrder + shippingFee;
         
         emailPromises.push(sendEmail({
           to: [{ email: formData.email, name: formData.name }],
           subject: `✅ ¡Pago recibido! Tu compra en Moda Circular está asegurada`,
           htmlContent: `
             <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
               <h2 style="color: #2F3C2C; border-bottom: 2px solid #F4F1EB; padding-bottom: 10px;">¡Gracias por tu compra, ${formData.name}!</h2>
               <p>Tu pago ha sido procesado correctamente. El dinero se encuentra protegido en <strong>fideicomiso</strong> y solo será liberado al vendedor cuando confirmes que recibiste tu pedido.</p>
               
               <div style="background: #F9F7F2; padding: 15px; border-radius: 8px; margin: 20px 0;">
                 <h3 style="margin-top: 0; font-size: 16px;">Resumen de tu pedido:</h3>
                 <ul style="padding-left: 20px;">
                   ${allProductsList}
                 </ul>
                 <div style="border-top: 1px solid #ddd; padding-top: 10px; margin-top: 10px;">
                   <p style="margin: 5px 0;">Subtotal Prendas: S/ ${totalOrder.toFixed(2)}</p>
                   <p style="margin: 5px 0;">Costo de Envío: S/ ${shippingFee.toFixed(2)}</p>
                   <p style="margin: 10px 0 0 0; font-size: 18px; font-weight: bold;">Total Pagado: S/ ${finalTotalWithShipping.toFixed(2)}</p>
                 </div>
               </div>

               <p style="font-weight: bold; color: #D4A373;">¿Qué sigue ahora?</p>
               <p style="font-size: 14px; line-height: 1.5;">
                 Los vendedores ya han sido notificados de tu pago y están preparando tus prendas. 
                 Recibirás un correo cuando cada paquete sea enviado. Aquí tienes los datos de contacto por si necesitas coordinar algo específico:
               </p>

               <div style="margin: 15px 0;">
                 ${contactInfo.map((info: any) => `
                   <div style="margin-bottom: 10px; padding: 10px; border: 1px solid #f0f0f0; border-radius: 5px;">
                     <strong>Vendedor:</strong> ${info.sellerName}<br/>
                     <strong>Prendas:</strong> ${info.productsList}<br/>
                     <strong>WhatsApp:</strong> <a href="https://wa.me/${info.whatsapp}" style="color: #25D366; font-weight: bold;">Escribir a ${info.sellerName}</a>
                   </div>
                 `).join('')}
               </div>

               <p style="font-size: 12px; color: #666; margin-top: 30px;">
                 Gracias por ser parte del cambio.<br/>
                 <strong>Equipo de Moda Circular</strong>
               </p>
             </div>
           `
         }).catch(err => console.error(`[Email] ❌ Error enviando confirmación al comprador:`, err)));
       }

       // 🟢 ESPERAR A QUE TODOS LOS CORREOS SE ENVÍEN ANTES DE TERMINAR
       if (emailPromises.length > 0) {
         await Promise.allSettled(emailPromises);
       }
    }

    revalidatePath('/');
    revalidatePath('/search');
    revalidatePath('/checkout/success');
    revalidatePath('/profile');
    revalidatePath('/dashboard/admin/vendedores');

    return { success: true, soldCount: availableIds.length, contacts: contactInfo, orderId: orderRecord?.id };
  } catch (error: any) {
    console.error("completePurchase Error:", error);
    return { success: false, error: error.message || "Error inesperado" };
  }
}

/**
 * Marca un producto como 'available'. Útil para cuando el comprador
 * cancela la compra o no responde después de reservar por WhatsApp.
 */
export async function markAsAvailable(productId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "No autorizado." };
    }

    // Verificar propiedad y obtener título
    const { data: existing, error: fetchErr } = await supabase
      .from('products')
      .select('title, brand, seller_id')
      .eq('id', productId)
      .single();

    if (fetchErr || !existing || existing.seller_id !== session.user.id) {
      return { success: false, error: "No tienes permiso para actualizar este producto." };
    }

    // 2. Buscar si tiene un ítem de orden pendiente para revertir saldo
    const { data: orderItem } = await supabaseAdmin
      .from('order_items')
      .select('id, payout_amount, seller_id')
      .eq('product_id', productId)
      .eq('status', 'pending')
      .maybeSingle();

    if (orderItem) {
      console.log(`[Escrow] Revirtiendo fondos para el producto ${productId}. Item: ${orderItem.id}`);
      const { error: rpcErr } = await supabaseAdmin.rpc('revert_escrow_funds', {
        target_seller_id: orderItem.seller_id,
        payout_to_revert: orderItem.payout_amount,
        ref_order_item_id: orderItem.id,
        tx_description: `Cancelación: ${existing.brand || ''} ${existing.title}`.trim()
      });

      if (rpcErr) {
        console.error("[Escrow] Error revert_escrow_funds:", rpcErr.message);
        // Continuamos para al menos liberar el producto, pero logueamos el error
      }
    }

    // 3. Actualizar estado del producto
    const { error } = await supabase
      .from('products')
      .update({ 
        status: 'available',
        buyer_name: null,
        buyer_phone: null,
        buyer_email: null
      })
      .eq('id', productId);

    if (error) {
       return { success: false, error: error.message };
    }

    revalidatePath('/');
    revalidatePath('/search');
    revalidatePath(`/products/${productId}`);
    revalidatePath('/profile');
    revalidatePath('/dashboard/admin/vendedores');

    return { success: true };
  } catch (error: any) {
    console.error("markAsAvailable Action Error:", error);
    return { success: false, error: error.message || "Error inesperado" };
  }
}

/**
 * El vendedor marca la prenda como 'enviada'.
 * Esto dispara un email al comprador con el link de conformidad.
 */
export async function markAsShipped(productId: string, trackingNumber?: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "No autorizado." };
    }

    // 1. Obtener datos de la prenda y el comprador
    const { data: product, error: fetchErr } = await supabaseAdmin
      .from('products')
      .select('*, users!inner(name)')
      .eq('id', productId)
      .single();

    if (fetchErr || !product || product.seller_id !== session.user.id) {
      return { success: false, error: "No tienes permiso para marcar esta prenda como enviada." };
    }

    if (product.status === 'shipped') {
      return { success: false, error: "Esta prenda ya ha sido marcada como enviada anteriormente." };
    }

    // 2. Obtener el order_item para generar el token de confirmación
    const { data: orderItem } = await supabaseAdmin
      .from('order_items')
      .select('id, order_id')
      .eq('product_id', productId)
      .maybeSingle();

    const { generateConfirmToken } = await import('@/lib/order-tokens');
    const token = orderItem ? generateConfirmToken(orderItem.id, orderItem.order_id) : '';

    // 2.5 Actualizar estados
    const { error: updateErr } = await supabaseAdmin
      .from('products')
      .update({
        status: 'shipped',
        shipped_at: new Date().toISOString(),
        tracking_number: trackingNumber || null,
        conformity_token: token // Guardamos el token generado para consistencia
      })
      .eq('id', productId);

    if (updateErr) {
      console.error(`[Shipping] ❌ Error actualizando producto ${productId}:`, updateErr.message);
      throw new Error(`No se pudo actualizar el estado del producto: ${updateErr.message}`);
    }
    
    const { error: updateItemErr } = await supabaseAdmin
      .from('order_items')
      .update({ status: 'shipped' })
      .eq('product_id', productId)
      .eq('status', 'pending');

    if (updateItemErr) {
      console.warn(`[Shipping] ⚠️ Advertencia: No se pudo actualizar el estado en order_items para el producto ${productId}:`, updateItemErr.message);
    } else {
      console.log(`[Shipping] ✅ Producto ${productId} y order_item actualizados a 'shipped'`);
    }

    // 3. Enviar Correo al Comprador (Fricción Cero)
    if (product.buyer_email) {
      const { sendEmail } = await import('@/lib/brevo');
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

      await sendEmail({
        to: [{ email: product.buyer_email, name: product.buyer_name || 'Comprador' }],
        subject: `¡Tu pedido ya fue enviado! ${product.title}`,
        htmlContent: `
          <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 0; border: 1px solid #f0f0f0; border-radius: 24px; overflow: hidden; background-color: #ffffff;">
            <!-- Header -->
            <div style="background-color: #2F3C2C; padding: 40px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 300; letter-spacing: 2px; text-transform: uppercase;">Moda Circular Luxury</h1>
            </div>

            <div style="padding: 40px 30px;">
              <h2 style="color: #2F3C2C; font-size: 22px; margin-top: 0; text-align: center;">¡Tu pedido está en camino!</h2>
              <p style="font-size: 16px; line-height: 1.6; color: #4a4a4a;">
                Hola <strong>${product.buyer_name || 'Comprador'}</strong>,
              </p>
              <p style="font-size: 16px; line-height: 1.6; color: #4a4a4a;">
                Grandes noticias: tu prenda <strong>${product.brand || ''} ${product.title}</strong> ha sido enviada por el vendedor y pronto estará contigo.
              </p>
              
              ${trackingNumber ? `
              <div style="background: #F9F7F2; padding: 20px; border-radius: 16px; margin: 25px 0; border: 1px solid #E9E2D5; text-align: center;">
                <p style="margin: 0; font-size: 12px; font-weight: bold; color: #D4A373; text-transform: uppercase; letter-spacing: 1px;">Número de seguimiento</p>
                <p style="margin: 8px 0 0 0; font-size: 18px; font-family: monospace; color: #2F3C2C; font-weight: bold;">${trackingNumber}</p>
              </div>
              ` : ''}

              <!-- Acciones Principales -->
              <div style="margin: 40px 0; padding: 35px; background: #ffffff; border: 1px solid #F4F1EB; border-radius: 24px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.03);">
                <p style="font-size: 15px; color: #2F3C2C; margin-bottom: 25px; font-weight: 600;">
                  ¿Ya recibiste tu prenda y todo está conforme?
                </p>
                
                ${token ? `
                <div style="margin-bottom: 30px;">
                  <a href="${siteUrl}/order/confirm/${token}" 
                     style="display: inline-block; background: #2F3C2C; color: #ffffff; padding: 16px 45px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(47, 60, 44, 0.25);">
                     Confirmar Recibido
                  </a>
                  <p style="margin: 15px 0 0 0; font-size: 11px; color: #888; line-height: 1.4;">
                    Al confirmar, el pago será liberado al vendedor.<br/>Solo confirma si tienes el producto en tus manos.
                  </p>
                </div>

                <div style="margin-top: 25px; padding-top: 25px; border-top: 1px solid #F4F1EB;">
                  <p style="font-size: 13px; color: #666; margin-bottom: 12px;">¿Hubo algún inconveniente con la prenda?</p>
                  <a href="${siteUrl}/order/refund-request/${token}" 
                     style="color: #cc3333; font-weight: 600; text-decoration: none; font-size: 14px; border-bottom: 1px solid #cc3333;">
                     Solicitar Devolución / Reportar Problema
                  </a>
                </div>
                ` : `
                <p style="text-align: center; font-size: 14px; color: #666;">
                  Para gestionar tu compra, ingresa a tu perfil en la plataforma.
                </p>
                `}
              </div>

              ${product.buyer_id ? `
              <div style="margin-top: 30px; padding: 20px; background: #F9F7F2; border-radius: 16px; border: 1px dashed #D4A373; text-align: center;">
                <p style="font-size: 12px; color: #666; margin: 0; line-height: 1.5;">
                  <strong>Opción para usuarios registrados:</strong><br/>
                  También puedes gestionar este pedido directamente desde tu 
                  <a href="${siteUrl}/profile" style="color: #D4A373; font-weight: bold; text-decoration: underline;">panel de usuario</a>.
                </p>
              </div>
              ` : `
              <p style="font-size: 12px; color: #999; text-align: center; margin-top: 20px; padding: 0 20px;">
                Como compraste como invitado, utiliza los botones superiores para gestionar tu pedido. No necesitas crear una cuenta.
              </p>
              `}
            </div>

            <!-- Footer -->
            <div style="background-color: #f9f9f9; padding: 30px; text-align: center; border-top: 1px solid #f0f0f0;">
              <p style="font-size: 12px; color: #999; margin: 0;">
                Gracias por elegir una moda más sostenible y consciente.<br/>
                <strong>Equipo de Moda Circular Luxury</strong>
              </p>
            </div>
          </div>
        `
      });
    }

    revalidatePath('/profile');
    return { success: true };
  } catch (error: any) {
    console.error("markAsShipped Action Error:", error);
    return { success: false, error: error.message || "Error inesperado" };
  }
}

/**
 * Versión AUTENTICADA de confirmación (desde el Perfil)
 */
export async function confirmConformity(productId: string) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: "No autorizado." };
    }

    // 1. Validar que el usuario sea el comprador de este producto
    const { data: product, error: fetchErr } = await supabaseAdmin
      .from('products')
      .select('id, price, seller_id, ai_on_demand_charge, buyer_email')
      .eq('id', productId)
      .single();

    if (fetchErr || !product || product.buyer_email !== session.user.email) {
      return { success: false, error: "No tienes permiso para confirmar esta prenda." };
    }

    // 2. Obtener el order_item_id relacionado
    const { data: orderItem } = await supabaseAdmin
      .from('order_items')
      .select('id')
      .eq('product_id', productId)
      .in('status', ['pending', 'shipped'])
      .single();

    if (!orderItem) {
      return { success: false, error: "No se encontró un ítem pendiente para esta prenda." };
    }

    // 3. Actualizar Producto (Estado visual)
    const { error } = await supabaseAdmin
      .from('products')
      .update({ 
        buyer_conformity: true,
        status: 'sold' // Marcar como vendido al confirmar recepción
      })
      .eq('id', productId);

    if (error) throw new Error(error.message);

    // 4. Liberar fondos usando la lógica centralizada (lib/orders.ts)
    const { processEscrowRelease } = await import('@/lib/orders');
    const releaseResult = await processEscrowRelease(orderItem.id);

    if (!releaseResult.success) {
      console.error("[Escrow] Error al liberar fondos:", releaseResult.error);
      // No fallamos el proceso de conformidad del usuario, pero logueamos el error para auditoría
    }

    revalidatePath('/profile');
    return { success: true };
  } catch (error: any) {
    console.error("confirmConformity Action Error:", error);
    return { success: false, error: error.message || "Error inesperado" };
  }
}

/**
 * Versión PÚBLICA de confirmación (vía Token de Email)
 */
export async function confirmConformityPublic(productId: string, token: string) {
  try {
    // 1. Validar Token en Supabase
    const { data: product, error: fetchErr } = await supabaseAdmin
      .from('products')
      .select('id')
      .eq('id', productId)
      .eq('conformity_token', token)
      .single();

    if (fetchErr || !product) {
      return { success: false, error: "Enlace inválido o expirado." };
    }

    // 2. Marcar Conformidad
    const { error } = await supabaseAdmin
      .from('products')
      .update({ buyer_conformity: true })
      .eq('id', productId);

    if (error) throw new Error(error.message);

    return { success: true };
  } catch (error: any) {
    console.error("confirmConformityPublic Action Error:", error);
    return { success: false, error: error.message || "Error inesperado" };
  }
}

/**
 * El vendedor solicita su pago o confirma la venta finalizada.
 * Soporta la regla de los 3 días de auto-aceptación.
 */
export async function confirmSale(productId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "No autorizado" };

    // 1. Obtener datos del producto
    const { data: product, error: fetchErr } = await supabaseAdmin
      .from('products')
      .select('*, users!inner(name)')
      .eq('id', productId)
      .single();

    if (fetchErr || !product) return { success: false, error: "Producto no encontrado" };
    if (product.seller_id !== session.user.id) return { success: false, error: "No tienes permiso" };
    
    // 2. Verificar condiciones de liberación (Comprador o Tiempo)
    const now = new Date();
    const shippedAt = product.shipped_at ? new Date(product.shipped_at) : null;
    const diffDays = shippedAt ? (now.getTime() - shippedAt.getTime()) / (1000 * 60 * 60 * 24) : 0;
    
    const isAutoConfirmed = diffDays >= 3;
    const isUserConfirmed = product.buyer_conformity === true;

    if (!isUserConfirmed && !isAutoConfirmed) {
      const waitDays = Math.max(0, 3 - diffDays).toFixed(1);
      return { 
        success: false, 
        error: `Aún no puedes cobrar. El comprador no ha confirmado la recepción y faltan ${waitDays} días para la liberación automática.` 
      };
    }

    // 3. Obtener el order_item_id relacionado
    const { data: orderItem } = await supabaseAdmin
      .from('order_items')
      .select('id')
      .eq('product_id', productId)
      .in('status', ['pending', 'shipped'])
      .single();

    if (!orderItem) {
      return { success: false, error: "No se encontró un ítem pendiente para esta prenda." };
    }

    // 4. Marcar como vendido definitivamente
    const { error: updateErr } = await supabaseAdmin
      .from('products')
      .update({ 
        status: 'sold',
        buyer_conformity: true
      })
      .eq('id', productId);

    if (updateErr) throw updateErr;

    // 5. Liberar fondos usando la lógica centralizada
    const { processEscrowRelease } = await import('@/lib/orders');
    const releaseResult = await processEscrowRelease(orderItem.id);

    if (!releaseResult.success) {
      throw new Error(`Fallo en liberación de fondos: ${releaseResult.error}`);
    }

    revalidatePath('/profile');
    revalidatePath(`/products/${productId}`);
    
    return { success: true, message: isAutoConfirmed ? "Venta confirmada por límite de tiempo (3 días)." : "Venta confirmada por el comprador." };
  } catch (error: any) {
    console.error("confirmSale Error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * El comprador inicia una disputa desde su perfil.
 */
export async function disputeConformity(productId: string) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: "No autorizado." };
    }

    // 1. Validar que el usuario sea el comprador
    const { data: product, error: fetchErr } = await supabaseAdmin
      .from('products')
      .select('id, buyer_email, title')
      .eq('id', productId)
      .single();

    if (fetchErr || !product || product.buyer_email !== session.user.email) {
      return { success: false, error: "No tienes permiso para iniciar una disputa sobre esta prenda." };
    }

    // 2. Obtener el order_item relacionado
    const { data: orderItem } = await supabaseAdmin
      .from('order_items')
      .select('id, status')
      .eq('product_id', productId)
      .single();

    if (!orderItem) {
      return { success: false, error: "No se encontró el ítem de la orden." };
    }

    if (orderItem.status !== 'pending' && orderItem.status !== 'shipped') {
      return { success: false, error: "Solo puedes disputar pedidos que aún no han sido finalizados." };
    }

    // 3. Cambiar estado a 'disputed'
    const { error: updateErr } = await supabaseAdmin
      .from('order_items')
      .update({ status: 'disputed' })
      .eq('id', orderItem.id);

    if (updateErr) throw updateErr;

    // 4. Notificar (opcional, pero recomendado)
    // Aquí podríamos disparar correos similares a disputeOrderItem pero usando el ID
    
    revalidatePath('/profile');
    return { success: true };
  } catch (error: any) {
    console.error("disputeConformity Error:", error);
    return { success: false, error: error.message || "Error inesperado" };
  }
}

/**
 * Registra una calificación para un producto/vendedor.
 * No requiere login, usa el token de conformidad para validar la transacción.
 */
export async function submitProductReview({
  productId,
  rating,
  comment,
  token
}: {
  productId: string;
  rating: number;
  comment: string;
  token: string;
}) {
  try {
    // 1. Validar Token
    const decoded = verifyConfirmToken(token);
    if (!decoded) {
      return { success: false, error: "Token inválido o expirado." };
    }

    const { itemId } = decoded;

    // 2. Obtener detalles del ítem
    const { data: item, error: fetchErr } = await supabaseAdmin
      .from('order_items')
      .select('id, order_id, product_id, seller_id')
      .eq('id', itemId)
      .single();

    if (fetchErr || !item) {
      return { success: false, error: "No se encontró el registro de la compra." };
    }

    // 3. Validaciones de negocio
    if (item.product_id !== productId) {
      return { success: false, error: "El producto no coincide con el token." };
    }

    // 4. Verificar si ya existe una reseña para este pedido
    const { data: existingReview } = await supabaseAdmin
      .from('product_reviews')
      .select('id')
      .eq('order_item_id', item.id)
      .single();

    if (existingReview) {
      return { success: false, error: "Ya has calificado esta compra." };
    }

    // 5. Obtener el buyer_id del pedido
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .select('buyer_id')
      .eq('id', item.order_id)
      .single();

    if (orderErr || !order) {
      return { success: false, error: "No se pudo encontrar la información del comprador." };
    }

    // 6. Insertar Reseña en la tabla unificada 'reviews'
    const { error: insertErr } = await supabaseAdmin
      .from('product_reviews')
      .insert({
        product_id: productId,
        order_item_id: item.id,
        buyer_id: order.buyer_id,
        seller_id: item.seller_id,
        rating,
        comment: comment.trim()
      });

    if (insertErr) {
      if (insertErr.code === '23505') {
        return { success: false, error: "Ya has calificado esta compra anteriormente." };
      }
      throw insertErr;
    }

    revalidatePath(`/products/${productId}`);
    
    return { success: true };
  } catch (error: any) {
    console.error("submitProductReview Error:", error);
    return { success: false, error: error.message || "Error al guardar la calificación." };
  }
}

