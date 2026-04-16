'use server';

import { supabase } from "@/lib/supabase";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

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
          images: formData.images || [], // Ahora incluimos las fotos
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
export async function completePurchase(productIds: string[]) {
  try {
    if (!productIds || productIds.length === 0) {
      return { success: false, error: "No hay productos en el carrito." };
    }

    // CAPA DE SEGURIDAD: Verificar que TODOS los productos aún estén disponibles
    const { data: products, error: checkError } = await supabase
      .from('products')
      .select('id, title, status')
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
      .update({ status: 'sold' })
      .in('id', availableIds);

    if (error) {
      console.error("Error marcando productos como vendidos:", error);
      return { success: false, error: error.message };
    }

    // Revalidar todas las páginas que muestran productos
    revalidatePath('/');
    revalidatePath('/search');
    revalidatePath('/profile');
    revalidatePath('/profile/settings');
    for (const id of availableIds) {
      revalidatePath(`/product/${id}`);
    }

    return { success: true, soldCount: availableIds.length };
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
