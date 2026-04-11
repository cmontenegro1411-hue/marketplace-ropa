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
