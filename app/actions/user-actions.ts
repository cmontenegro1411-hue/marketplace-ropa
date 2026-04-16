'use server';

import { supabase } from "@/lib/supabase";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: { name: string; email: string; whatsapp_number?: string }) {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: "No autorizado" };
  }

  try {
    const { error } = await supabase
      .from('users')
      .update({
        name: formData.name,
        email: formData.email,
        whatsapp_number: formData.whatsapp_number
      })
      .eq('id', session.user.id);

    if (error) throw error;

    revalidatePath('/profile');
    return { success: true };
  } catch (error: any) {
    console.error("Error updating profile:", error);
    return { success: false, error: error.message };
  }
}
