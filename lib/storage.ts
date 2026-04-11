import { supabase } from './supabase';

export const uploadProductImage = async (file: File): Promise<string | null> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = `product-images/${fileName}`;

  const { data, error } = await supabase.storage
    .from('products')
    .upload(filePath, file);

  if (error) {
    throw new Error(`Error al subir imagen: ${error.message}`);
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('products')
    .getPublicUrl(filePath);

  return publicUrl;
};

export const uploadMultipleImages = async (files: File[]): Promise<string[]> => {
  const uploadPromises = files.map(file => uploadProductImage(file));
  const urls = await Promise.all(uploadPromises);
  return urls.filter((url): url is string => url !== null);
};
