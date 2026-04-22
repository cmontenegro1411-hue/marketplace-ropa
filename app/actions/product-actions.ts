'use server';

import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { sendEmail } from '@/lib/brevo';
import { generateConfirmToken } from "@/lib/order-tokens";


export async function createListing(formData: any) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return { success: false, error: "No autorizado. Inicie sesión." };
    }

    // Validar conexión obligatoria a Mercado Pago
    const { data: userMP } = await supabase
      .from('users')
      .select('mp_access_token')
      .eq('id', session.user.id)
      .single();

    const isBypassEnabled = process.env.ALLOW_DEBUG_BYPASS === 'true' || process.env.NEXT_PUBLIC_ALLOW_DEBUG_BYPASS === 'true';

    if (!userMP?.mp_access_token && !isBypassEnabled) {
      return { 
        success: false, 
        error: "Debes vincular tu cuenta de Mercado Pago en tu perfil antes de publicar prendas para poder recibir tus pagos." 
      };
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
    revalidatePath(`/product/${productId}`);
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
export async function completePurchase(productIds: string[], formData: any) {
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
    const { data: products, error: checkError } = await supabase
      .from('products')
      .select('id, title, brand, status, seller_id, price')
      .in('id', productIds);

    if (checkError) {
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
    const availableIds = products?.filter(p => p.status !== 'sold').map(p => p.id) || [];

    const { error } = await supabase
      .from('products')
      .update({ 
        status: 'reserved',
        buyer_name: formData.name,
        buyer_phone: formData.buyer_phone,
        buyer_email: formData.email
      })
      .in('id', availableIds);

    if (error) {
      console.error("Error marcando productos como reservados:", error);
      return { success: false, error: error.message };
    }

    // Obtener los datos de contacto de los vendedores (incluyendo email para notificar)
    const sellerIds = [...new Set(products!.map(p => p.seller_id))];
    const { data: sellers } = await supabase
      .from('users')
      .select('id, name, email, whatsapp_number')
      .in('id', sellerIds);

    // Importar dinámicamente para evitar problemas de ciclo en el build si los hubiera
    const { sendEmail } = await import('@/lib/brevo');

    // Mapear los productos vendidos a cada seller respectivo y notificar
    const contactInfo = [];
    const emailPromises = [];
    
    if (sellers) {
      for (const seller of sellers) {
        const sellerProducts = products!.filter(p => p.seller_id === seller.id);
        const totalAmount = sellerProducts.reduce((sum, p) => sum + p.price, 0);
        
        // Registrar info para el comprador
        contactInfo.push({
          sellerId: seller.id,
          sellerName: seller.name || 'Vendedor',
          whatsapp: seller.whatsapp_number,
          productCount: sellerProducts.length,
          totalAmount: totalAmount,
          productsList: sellerProducts.map(p => p.title).join(', ')
        });

        // 🟢 NOTIFICAR AL VENDEDOR POR CORREO
        if (seller.email) {
          const productNames = sellerProducts.map(p => `<li>${p.title} - S/ ${p.price}</li>`).join('');
          
          emailPromises.push(sendEmail({
            to: [{ email: seller.email, name: seller.name || 'Vendedor' }],
            subject: `🔔 ¡Venta realizada! Han separado ${sellerProducts.length} de tus prendas`,
            htmlContent: `
              <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
                <h2 style="color: #2F3C2C; border-bottom: 2px solid #F4F1EB; padding-bottom: 10px;">¡Felicidades, ${seller.name || 'Vendedor'}!</h2>
                <p>Un comprador ha separado prendas de tu closet en <strong>Moda Circular</strong>. Aquí tienes los detalles:</p>
                
                <div style="background: #F9F7F2; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="margin-top: 0; font-size: 16px;">Prendas vendidas:</h3>
                  <ul style="padding-left: 20px;">
                    ${productNames}
                  </ul>
                  <p style="font-weight: bold;">Total a recibir: S/ ${totalAmount.toFixed(2)}</p>
                </div>

                <div style="border-left: 4px solid #D4A373; padding-left: 15px; margin: 20px 0;">
                  <h3 style="margin-top: 0; font-size: 16px;">Datos del Comprador:</h3>
                  <p style="margin: 5px 0;"><strong>Nombre:</strong> ${formData.name}</p>
                  <p style="margin: 5px 0;"><strong>Email:</strong> ${formData.email}</p>
                  <p style="margin: 5px 0;"><strong>WhatsApp:</strong> ${formData.buyer_phone || 'No proporcionado'}</p>
                </div>

                <p style="font-size: 14px; color: #666; line-height: 1.5;">
                  <strong>Siguiente paso:</strong> El comprador tiene tus datos y probablemente te escriba pronto por WhatsApp. 
                  Te recomendamos ser proactivo y escribirle tú también si ves que pasan unas horas, para coordinar el pago final y la entrega.
                </p>
                
                <div style="text-align: center; margin-top: 30px;">
                  <a href="${process.env.NEXT_PUBLIC_SITE_URL}/profile" style="background: #2F3C2C; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Ver mi Closet</a>
                </div>

                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
                <p style="font-size: 11px; color: #999; text-align: center;">Este es un mensaje automático de Moda Circular Luxury.</p>
              </div>
            `
          }).catch(err => console.error(`Error enviando notificación al vendedor ${seller.id}:`, err)));
        }
      }
    }

    // Revalidar todas las páginas que muestran productos
    revalidatePath('/');
    revalidatePath('/search');
    revalidatePath('/profile');
    revalidatePath('/profile/settings');
    for (const id of availableIds) {
      revalidatePath(`/product/${id}`);
    }

    // 🟢 REGISTRAR LA ORDEN EN SUPABASE (Primero para tener el ID para los links)
    const totalOrder = products!.reduce((sum, p) => sum + p.price, 0);
    const orderItemsSummary = products!.map(p => ({ title: p.title, brand: p.brand, price: p.price }));

    const { data: orderRecord, error: orderErr } = await supabase
      .from('orders')
      .insert({
        buyer_name: formData.name,
        buyer_email: formData.email,
        buyer_phone: formData.buyer_phone,
        total_amount: totalOrder,
        items: orderItemsSummary,
        // IMPORTANTE: Bypass marca como completado para facilitar pruebas. 
        // Revertir a 'pendiente' cuando se active Mercado Pago real.
        payment_status: 'completed' 
      })
      .select('id')
      .single();

    if (orderErr) {
       console.error('[Orders DB] Error al guardar orden en Supabase:', orderErr.message);
    } else if (orderRecord) {
       // 🟢 REGISTRAR ITEMS INDIVIDUALES Y CAPTURAR FONDOS EN ESCROW
       for (const p of products!) {
         const payoutAmount = p.price * 0.90; // 10% comisión plataforma (sin fee de MP en bypass)
         
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

         if (!itemErr && itemRecord) {
           // Invocar RPC de captura para auditoría y balance_pending
           await supabaseAdmin.rpc('capture_escrow_funds', {
             target_seller_id: p.seller_id,
             payout_amount: payoutAmount,
             ref_order_id: orderRecord.id,
             ref_order_item_id: itemRecord.id,
             tx_description: `Venta (Bypass): ${p.brand} ${p.title}`
           });
         }
       }
    }

    // 🟢 NOTIFICAR AL COMPRADOR POR CORREO
    if (formData.email && orderRecord) {
      // Obtener los IDs de los order_items recién creados para generar tokens por ítem
      const { data: savedItems } = await supabase
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
          <div style="margin-top: 12px; display: flex; gap: 10px;">
            <div style="display: inline-block; vertical-align: top; width: 45%;">
              <a href="${process.env.NEXT_PUBLIC_SITE_URL}/order/confirm/${p.token}" 
                 style="display: inline-block; background: #2F3C2C; color: white; padding: 8px 15px; text-decoration: none; border-radius: 20px; font-size: 11px; font-weight: bold; text-transform: uppercase;">Confirmar Recibido</a>
              <p style="margin: 5px 0 0 0; font-size: 9px; color: #666; line-height: 1.2;">Usa esta opción si ya tienes tu prenda y todo está perfecto. Libera el pago al vendedor.</p>
            </div>
            <div style="display: inline-block; vertical-align: top; width: 45%; margin-left: 5%;">
              <a href="${process.env.NEXT_PUBLIC_SITE_URL}/order/refund-request/${p.token}" 
                 style="display: inline-block; font-size: 11px; background: #fff; color: #cc3333; padding: 8px 15px; text-decoration: none; border-radius: 20px; font-weight: bold; text-transform: uppercase; border: 1px solid #cc3333;">
                 ❌ Solicitar Devolución
              </a>
              <p style="margin: 5px 0 0 0; font-size: 10px; color: #cc3333; line-height: 1.2;">¿Algún problema? Haz clic para bloquear el pago e iniciar la devolución.</p>
            </div>
          </div>
        </li>
      `).join('');
      const totalOrder = products!.reduce((sum, p) => sum + p.price, 0);

      emailPromises.push(sendEmail({
        to: [{ email: formData.email, name: formData.name }],
        subject: `✅ ¡Confirmación de tu pedido en Moda Circular!`,
        htmlContent: `
          <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
            <h2 style="color: #2F3C2C; border-bottom: 2px solid #F4F1EB; padding-bottom: 10px;">¡Gracias por tu compra, ${formData.name}!</h2>
            <p>Has separado con éxito las siguientes prendas en <strong>Moda Circular</strong>. Estás apoyando una moda más sostenible.</p>
            
            <div style="background: #F9F7F2; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; font-size: 16px;">Resumen de tu pedido:</h3>
              <ul style="padding-left: 20px;">
                ${allProductsList}
              </ul>
              <p style="font-size: 18px; font-weight: bold; border-top: 1px solid #ddd; padding-top: 10px; margin-top: 10px;">
                Total: S/ ${totalOrder.toFixed(2)}
              </p>
            </div>

            <p style="font-weight: bold; color: #D4A373;">¿Qué sigue ahora?</p>
            <p style="font-size: 14px; line-height: 1.5;">
              Cada vendedor ha recibido tus datos y se pondrá en contacto contigo pronto para coordinar el pago final y la entrega. 
              Si prefieres adelantarte, aquí tienes sus datos:
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
      }).catch(err => console.error(`Error enviando confirmación al comprador:`, err)));
    }

    // 🟢 ESPERAR A QUE TODOS LOS CORREOS SE ENVÍEN ANTES DE TERMINAR
    if (emailPromises.length > 0) {
      await Promise.allSettled(emailPromises);
    }

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

    // Verificar propiedad
    const { data: existing, error: fetchErr } = await supabase
      .from('products')
      .select('seller_id')
      .eq('id', productId)
      .single();

    if (fetchErr || !existing || existing.seller_id !== session.user.id) {
      return { success: false, error: "No tienes permiso para actualizar este producto." };
    }

    const { error } = await supabase
      .from('products')
      .update({ status: 'available' })
      .eq('id', productId);

    if (error) {
       return { success: false, error: error.message };
    }

    revalidatePath('/');
    revalidatePath('/search');
    revalidatePath(`/product/${productId}`);
    revalidatePath('/profile');

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

    // 2. Generar/Obtener Token (si no existe) y actualizar estado
    const conformityToken = product.conformity_token || crypto.randomUUID();
    
    const { error: updateErr } = await supabaseAdmin
      .from('products')
      .update({
        status: 'shipped',
        shipped_at: new Date().toISOString(),
        tracking_number: trackingNumber || null,
        conformity_token: conformityToken
      })
      .eq('id', productId);

    if (updateErr) throw new Error(updateErr.message);

    // 3. Enviar Correo al Comprador (Fricción Cero)
    if (product.buyer_email) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
      const confirmLink = `${siteUrl}/checkout/confirm?t=${conformityToken}&p=${productId}`;
      
      await sendEmail({
        to: [{ email: product.buyer_email, name: product.buyer_name || 'Comprador' }],
        subject: `¡Tu pedido ya fue enviado! ${product.title}`,
        htmlContent: `
          <div style="font-family: serif; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0dcd0; border-radius: 20px;">
            <h1 style="color: #4a5d4e; text-align: center;">¡Buenas noticias!</h1>
            <p>Hola <strong>${product.buyer_name || 'Comprador'}</strong>,</p>
            <p>Tu prenda <strong>${product.title}</strong> de la marca <strong>${product.brand || 'Moda Circular'}</strong> ha sido enviada por el vendedor.</p>
            ${trackingNumber ? `<p style="background: #fdfaf6; padding: 10px; border-radius: 10px;">📦 <strong>Número de rastreo:</strong> ${trackingNumber}</p>` : ''}
            <div style="text-align: center; margin: 30px 0;">
              <p style="font-size: 14px; color: #666; margin-bottom: 20px;">Cuando recibas el producto y verifiques que todo está correcto, por favor confírmalo haciendo clic abajo:</p>
              <a href="${confirmLink}" style="background-color: #4a5d4e; color: #fdfaf6; padding: 15px 30px; text-decoration: none; border-radius: 30px; font-weight: bold; display: inline-block;">CONFIRMAR RECEPCIÓN CONFORME</a>
            </div>
            <p style="font-size: 11px; color: #999; text-align: center;">Si tienes algún inconveniente, contáctanos respondiendo a este correo.</p>
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
      .eq('status', 'pending')
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
      .eq('status', 'pending')
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
    revalidatePath(`/product/${productId}`);
    
    return { success: true, message: isAutoConfirmed ? "Venta confirmada por límite de tiempo (3 días)." : "Venta confirmada por el comprador." };
  } catch (error: any) {
    console.error("confirmSale Error:", error);
    return { success: false, error: error.message };
  }
}
