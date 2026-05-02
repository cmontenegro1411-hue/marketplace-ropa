'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';

import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

export async function getSellersByProductIds(productIds: string[]) {
  try {
    console.log(`[Shipping] Fetching sellers for products:`, productIds);

    // 1. Obtener los productos para saber quiénes son los vendedores
    const { data: products, error: pError } = await supabaseAdmin
      .from('products')
      .select('id, seller_id')
      .in('id', productIds);

    if (pError) throw pError;
    if (!products || products.length === 0) return { success: true, data: [] };

    const sellerIds = [...new Set(products.map(p => p.seller_id))];

    // 2. Obtener la información de envío de los vendedores
    const { data: sellers, error: sError } = await supabaseAdmin
      .from('users')
      .select('id, ubigeo_code, shipping_rates')
      .in('id', sellerIds);

    if (sError) throw sError;

    // 3. Mapear la información
    const sellersMap = new Map(sellers?.map(s => [s.id, s]));

    const result = products.map(p => {
      const seller = sellersMap.get(p.seller_id);
      
      // LOG de depuración para ver qué viene de la base de datos
      console.log(`[Shipping] Product: ${p.id}, Seller: ${p.seller_id}, Ubigeo: ${seller?.ubigeo_code}, Rates:`, seller?.shipping_rates);

      return {
        productId: p.id,
        sellerId: p.seller_id,
        ubigeoCode: seller?.ubigeo_code?.toString() || null,
        shippingRates: seller?.shipping_rates || { local: 10, regional: 15, national: 25 }
      };
    });

    return { success: true, data: result };
  } catch (error: any) {
    console.error('Error fetching sellers ubigeo:', error);
    return { success: false, error: error.message };
  }
}

export async function updateSellerLocation(ubigeoCode: string, address: string, shippingRates: any) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "No autorizado" };

    const { error } = await supabaseAdmin
      .from('users')
      .update({ 
        ubigeo_code: ubigeoCode,
        address: address,
        shipping_rates: shippingRates
      })
      .eq('id', session.user.id);

    if (error) throw error;

    revalidatePath('/profile/settings');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
