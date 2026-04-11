'use client';

import React, { useState, useEffect } from 'react';
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { uploadMultipleImages } from "@/lib/storage";
import { updateListing } from "@/app/actions/product-actions";
import { useRouter } from 'next/navigation';

interface EditProductFormProps {
  product: any;
}

export function EditProductForm({ product }: EditProductFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Images handling
  const [existingImages, setExistingImages] = useState<string[]>(product.images || []);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    title: product.title || '',
    brand: product.brand || '',
    category: product.category || '',
    condition: product.condition || '',
    size: product.size || '',
    description: product.description || '',
    price: product.price?.toString() || ''
  });

  const handleNewImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setNewImages(prev => [...prev, ...files]);
      
      const previews = files.map(file => URL.createObjectURL(file));
      setNewPreviews(prev => [...prev, ...previews]);
    }
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
    setNewPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (existingImages.length === 0 && newImages.length === 0) {
      alert("La prenda debe tener al menos una imagen.");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // 1. Upload only new images if any
      let uploadedUrls: string[] = [];
      if (newImages.length > 0) {
        uploadedUrls = await uploadMultipleImages(newImages);
      }

      // 2. Combine with existing ones
      const finalImages = [...existingImages, ...uploadedUrls];

      // 3. Update Listing
      const result = await updateListing(product.id, {
        ...formData,
        price: Number(formData.price),
        images: finalImages
      });
      
      if (result.success) {
        setIsSuccess(true);
        setTimeout(() => router.push('/profile'), 2000);
      } else {
        alert("Error: " + result.error);
      }
    } catch (error: any) {
      alert("Error al actualizar: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center py-20">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 text-primary">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        </div>
        <h2 className="text-3xl font-serif font-bold text-primary mb-4">¡Cambios Guardados!</h2>
        <p className="text-muted">Redirigiendo a tu closet...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[32px] p-10 shadow-xl border border-sand">
      <form className="space-y-8" onSubmit={handleSubmit}>
        
        {/* Combined Image Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
          {/* Existing */}
          {existingImages.map((src, idx) => (
            <div key={`exist-${idx}`} className="relative aspect-square rounded-2xl overflow-hidden bg-cream border border-sand">
              <img src={src} className="w-full h-full object-cover" alt="Current" />
              <button type="button" onClick={() => removeExistingImage(idx)} className="absolute top-2 right-2 bg-white/90 p-1 rounded-full shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-secondary"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
          ))}
          {/* New */}
          {newPreviews.map((src, idx) => (
            <div key={`new-${idx}`} className="relative aspect-square rounded-2xl overflow-hidden bg-primary/5 border-2 border-dashed border-primary/20">
              <img src={src} className="w-full h-full object-cover opacity-80" alt="New" />
              <button type="button" onClick={() => removeNewImage(idx)} className="absolute top-2 right-2 bg-white/90 p-1 rounded-full shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-secondary"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
              <div className="absolute bottom-1 left-1 bg-primary text-[8px] text-cream px-1.5 py-0.5 rounded-full font-bold uppercase">Nuevo</div>
            </div>
          ))}
          {/* Upload More Button */}
          <label className="aspect-square rounded-2xl border-2 border-dashed border-sand flex items-center justify-center cursor-pointer hover:bg-cream/50 transition-all">
            <input type="file" multiple className="hidden" onChange={handleNewImageUpload} />
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sand"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          </label>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted">Título</label>
            <input required type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full bg-cream/30 border border-sand rounded-2xl px-5 py-4 text-sm focus:border-primary outline-none text-primary font-medium" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted">Marca</label>
            <input required type="text" value={formData.brand} onChange={(e) => setFormData({...formData, brand: e.target.value})} className="w-full bg-cream/30 border border-sand rounded-2xl px-5 py-4 text-sm focus:border-primary outline-none" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted">Talla</label>
            <input required type="text" value={formData.size} onChange={(e) => setFormData({...formData, size: e.target.value})} className="w-full bg-cream/30 border border-sand rounded-2xl px-5 py-4 text-sm focus:border-primary outline-none" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted">Categoría</label>
            <select required value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full bg-cream/30 border border-sand rounded-2xl px-5 py-4 text-sm focus:border-primary outline-none appearance-none font-medium">
              <option value="Mujer">Mujer</option>
              <option value="Hombre">Hombre</option>
              <option value="Accesorios">Accesorios</option>
              <option value="Calzado">Calzado</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted">Precio ($ USD)</label>
            <input required type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="w-full font-serif font-bold text-xl text-secondary bg-cream/30 border border-sand rounded-2xl px-5 py-4 focus:border-primary outline-none" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-muted">Estado de la prenda</label>
          <div className="flex flex-wrap gap-2">
            {['Nuevo con etiqueta', 'Muy buen estado', 'Buen estado', 'Usado'].map(c => (
              <button key={c} type="button" onClick={() => setFormData({...formData, condition: c})} className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${formData.condition === c ? 'bg-primary text-cream shadow-md' : 'bg-cream text-muted hover:bg-sand'}`}>{c}</button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-muted">Descripción</label>
          <textarea rows={4} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full bg-cream/30 border border-sand rounded-2xl px-5 py-4 text-sm focus:border-primary outline-none resize-none" />
        </div>

        <div className="flex gap-4 pt-4">
          <Button type="button" variant="outline" className="flex-1" onClick={() => router.back()}>Cancelar</Button>
          <Button type="submit" className="flex-[2]" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando Cambios...' : 'Guardar Cambios'}
          </Button>
        </div>
      </form>
    </div>
  );
}
