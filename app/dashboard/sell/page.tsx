'use client';

import React, { useState } from 'react';
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { uploadMultipleImagesViaAPI } from "@/lib/storage";
import { createListing } from "@/app/actions/product-actions";
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const SellPage = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    title: '',
    brand: '',
    category: '',
    categoryType: '',
    condition: '',
    size: '',
    description: '',
    price: ''
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setImages(prev => [...prev, ...newFiles]);
      
      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setPreviews(prev => [...prev, ...newPreviews]);

      // Soft AI Simulation (no forced values)
      setTimeout(() => {
        // Auto-analysis complete
      }, 1000);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (images.length === 0) {
      alert("Por favor, sube al menos una foto de tu prenda.");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // 1. Upload Images
      const imageUrls = await uploadMultipleImagesViaAPI(images);

      // 2. Submit Listing
      const result = await createListing({
        ...formData,
        category: `${formData.category} | ${formData.categoryType}`,
        price: Number(formData.price),
        images: imageUrls
      });
      
      if (result.success) {
        setIsSuccess(true);
        setTimeout(() => router.push('/profile'), 2000);
      } else {
        alert("Error de base de datos: " + (result.error || "Desconocido"));
      }
    } catch (error: any) {
      console.error("Submission error:", error);
      alert("Error al publicar: " + (error.message || "Revisa tu conexión a Supabase y los permisos del bucket."));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <Container className="max-w-md text-center">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <h2 className="text-3xl font-serif font-bold text-primary mb-4">¡Publicado con éxito!</h2>
          <p className="text-muted mb-8">Tu prenda ya está disponible para el mundo en la base de datos real de Supabase.</p>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sand/30 py-12">
      <Container className="max-w-3xl">
          <header className="mb-12">
            <Link href="/profile" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted hover:text-primary transition-colors mb-6 group">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:-translate-x-1"><path d="m15 18-6-6 6-6"/></svg>
              Volver a Mi Closet
            </Link>

            {/* AI Banner */}
            <Link
              href="/dashboard/ai-listing"
              className="flex items-center gap-4 bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-2xl px-5 py-4 mb-6 hover:border-primary/40 transition-all group"
            >
              <span className="text-2xl">✨</span>
              <div className="flex-1">
                <p className="text-sm font-bold text-primary">Usá la IA para completar este formulario</p>
                <p className="text-xs text-muted">Subí una foto y la IA detecta marca, precio y descripción automáticamente</p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary/50 group-hover:translate-x-1 transition-transform">
                <path d="m9 18 6-6-6-6"/>
              </svg>
            </Link>

            <h1 className="text-4xl lg:text-5xl font-serif font-bold text-primary mb-2">Nueva Publicación</h1>
            <p className="text-muted italic">Asegúrate de tomar fotos con buena iluminación para vender más rápido.</p>
          </header>

        <div className="bg-white rounded-[32px] p-10 shadow-xl border border-sand">
          <form className="space-y-8" onSubmit={handleSubmit}>
            
            {/* Image Preview Grid */}
            {previews.length > 0 && (
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-4">
                {previews.map((src, idx) => (
                  <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden shadow-inner bg-cream">
                    <img src={src} className="w-full h-full object-cover" alt="Preview" />
                    <button type="button" onClick={() => removeImage(idx)} className="absolute top-2 right-2 bg-white/90 p-1 rounded-full shadow-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-secondary"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Area */}
            <label className={`block border-2 border-dashed rounded-3xl p-12 text-center transition-all cursor-pointer ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-cream/50 border-sand'}`}>
              <input type="file" multiple className="hidden" onChange={handleImageUpload} disabled={isSubmitting} />
              <div className="w-16 h-16 bg-cream rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
              </div>
              <p className="text-sm font-bold text-primary">Haz clic para subir fotos</p>
            </label>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted">¿Qué vendes?</label>
                <input required type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="Nombre de la prenda" className="w-full bg-cream/30 border border-sand rounded-2xl px-5 py-4 text-sm focus:border-primary outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted">Marca</label>
                <input required type="text" value={formData.brand} onChange={(e) => setFormData({...formData, brand: e.target.value})} placeholder="Ej: Zara, Vintage, etc." className="w-full bg-cream/30 border border-sand rounded-2xl px-5 py-4 text-sm focus:border-primary outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted">Talla</label>
                <input required type="text" value={formData.size} onChange={(e) => setFormData({...formData, size: e.target.value})} placeholder="Ej: M, 38, L, Única" className="w-full bg-cream/30 border border-sand rounded-2xl px-5 py-4 text-sm focus:border-primary outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted">¿Para quién?</label>
                <select required value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full bg-cream/30 border border-sand rounded-2xl px-5 py-4 text-sm focus:border-primary outline-none appearance-none">
                  <option value="">Seleccionar...</option>
                  <option value="Mujer">Mujer</option>
                  <option value="Hombre">Hombre</option>
                  <option value="Niños">Niños</option>
                  <option value="Unisex">Unisex</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted">Tipo de Artículo</label>
                <select required value={formData.categoryType} onChange={(e) => setFormData({...formData, categoryType: e.target.value})} className="w-full bg-cream/30 border border-sand rounded-2xl px-5 py-4 text-sm focus:border-primary outline-none appearance-none">
                  <option value="">Seleccionar...</option>
                  <option value="Ropa">Ropa</option>
                  <option value="Calzado">Calzado</option>
                  <option value="Accesorios">Accesorios</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted">Precio (S/ Soles)</label>
                <input required type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} placeholder="0.00" className="w-full font-serif font-bold text-xl text-secondary bg-cream/30 border border-sand rounded-2xl px-5 py-4 focus:border-primary outline-none" />
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
              <textarea rows={3} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Háblanos de la talla, el material..." className="w-full bg-cream/30 border border-sand rounded-2xl px-5 py-4 text-sm focus:border-primary outline-none resize-none" />
            </div>

            <Button 
              type="submit" 
              fullWidth 
              size="lg" 
              disabled={isSubmitting || !formData.title || images.length === 0}
            >
              {isSubmitting ? 'Publicando en Supabase...' : 'Publicar Ahora'}
            </Button>
          </form>
        </div>
      </Container>
    </div>
  );
};

export default SellPage;
