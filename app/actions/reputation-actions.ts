'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

export async function getSellersReputations(sellerIds: string[]) {
  try {
    if (!sellerIds || sellerIds.length === 0) return {};

    const { data, error } = await supabaseAdmin
      .from('product_reviews')
      .select('seller_id, rating')
      .in('seller_id', sellerIds);

    if (error) throw error;

    const reputations: Record<string, { rating: number, reviewCount: number }> = {};
    
    // Initialize
    sellerIds.forEach(id => {
      reputations[id] = { rating: 0, reviewCount: 0 };
    });

    if (data) {
      data.forEach(review => {
        const rep = reputations[review.seller_id];
        if (rep) {
          rep.rating += review.rating;
          rep.reviewCount += 1;
        }
      });

      // Calculate averages
      Object.keys(reputations).forEach(id => {
        const rep = reputations[id];
        if (rep.reviewCount > 0) {
          rep.rating = parseFloat((rep.rating / rep.reviewCount).toFixed(1));
        }
      });
    }

    return reputations;
  } catch (error) {
    console.error('Error fetching sellers reputations:', error);
    return {};
  }
}

export async function getSellerReputation(sellerId: string) {
  console.log('[getSellerReputation] Fetching for sellerId:', sellerId);
  try {
    const { data, error } = await supabaseAdmin
      .from('product_reviews')
      .select(`
        rating,
        comment,
        created_at,
        is_public,
        buyer:users!buyer_id (
          name
        )
      `)
      .eq('seller_id', sellerId)
      .or('is_public.eq.true,is_public.is.null')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const reviewCount = data?.length || 0;
    const averageRating = reviewCount > 0 
      ? parseFloat((data.reduce((acc, rev) => acc + rev.rating, 0) / reviewCount).toFixed(1))
      : 0;

    const reviews = data?.map(rev => {
      const buyerName = (rev.buyer as any)?.name || 'Comprador';
      return {
        reviewerName: `${buyerName.split(' ')[0]}`, // Mostramos solo el primer nombre
        rating: rev.rating,
        comment: rev.comment,
        date: rev.created_at
      };
    }) || [];

    const result = {
      rating: averageRating,
      reviewCount,
      reviews
    };
    console.log('[getSellerReputation] Returning:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('Error fetching seller reputation:', error);
    return { rating: 0, reviewCount: 0, reviews: [] };
  }
}

export async function createSellerReview(data: {
  sellerId: string;
  orderId: string;
  rating: number;
  comment: string;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "No autorizado" };

    // Obtener product_id si no viene (el order_item_id es data.orderId)
    const { data: item, error: itemErr } = await supabaseAdmin
      .from('order_items')
      .select('product_id')
      .eq('id', data.orderId)
      .single();

    if (itemErr || !item) {
      return { success: false, error: "No se encontró el ítem de la orden para calificar." };
    }

    // Verificar si ya existe una reseña para este ítem
    const { data: existingReview } = await supabaseAdmin
      .from('product_reviews')
      .select('id')
      .eq('order_item_id', data.orderId)
      .single();

    if (existingReview) {
      return { success: false, error: "Ya has calificado esta compra anteriormente." };
    }

    const { error } = await supabaseAdmin
      .from('product_reviews')
      .insert({
        seller_id: data.sellerId,
        buyer_id: session.user.id,
        order_item_id: data.orderId,
        product_id: item.product_id,
        rating: data.rating,
        comment: data.comment
      });

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: "Ya has calificado esta compra anteriormente." };
      }
      throw error;
    }

    revalidatePath(`/products`);
    return { success: true };
  } catch (error: any) {
    console.error('Error creating review:', error);
    return { success: false, error: error.message || "Error al guardar la calificación." };
  }
}
