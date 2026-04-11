import React from 'react';
import { supabase } from "@/lib/supabase";
import { Container } from "@/components/ui/Container";
import { Navbar } from "@/components/ui/Navbar";
import { Button } from "@/components/ui/Button";
import Link from 'next/link';
import { AddToCartButton } from "@/components/product/AddToCartButton";

export default async function ProductDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  // En Next.js 15+, params es una Promesa y DEBE ser esperada
  const { id } = await params;

  // Fetch product data
  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error || !product) {
    return (
      <div className="min-h-screen bg-cream">
        <Navbar />
        <Container className="py-20 text-center">
          <h1 className="text-2xl font-serif text-primary">Producto no encontrado</h1>
          <p className="text-muted mt-2 italic text-sm">ID: {id}</p>
          <Link href="/search" className="text-secondary hover:underline mt-4 inline-block font-bold">Volver al catálogo</Link>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      
      <Container className="py-12 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
          {/* Image Gallery Side */}
          <div className="space-y-6">
            <div className="aspect-[3/4] rounded-3xl overflow-hidden bg-white border border-sand shadow-sm">
              <img 
                src={product.images?.[0] || '/placeholder-product.png'} 
                alt={product.title}
                className="w-full h-full object-cover transition-all hover:scale-105"
              />
            </div>
          </div>

          {/* Product Info Side */}
          <div className="flex flex-col">
            <nav className="flex gap-2 text-[10px] font-bold uppercase tracking-widest text-muted mb-8">
              <Link href="/" className="hover:text-primary transition-colors">Inicio</Link>
              <span>/</span>
              <Link href="/search" className="hover:text-primary transition-colors">Moda</Link>
              <span>/</span>
              <span className="text-primary truncate max-w-[150px]">{product.title}</span>
            </nav>

            <div className="mb-8">
              <p className="text-sm font-bold uppercase tracking-[0.3em] text-secondary mb-3">{product.brand}</p>
              <h1 className="text-4xl lg:text-5xl font-serif font-bold text-primary mb-4">{product.title}</h1>
              <div className="flex items-baseline gap-4 mb-6">
                <span className="text-3xl font-serif font-bold text-primary">S/ {product.price}</span>
                <span className="text-xs text-muted italic">Precio final</span>
              </div>
              <div className="inline-block px-4 py-1.5 rounded-full bg-sand border border-sand/50 text-[10px] font-bold uppercase tracking-wider text-primary">
                Condición: {product.condition}
              </div>
            </div>

            <div className="space-y-8 py-8 border-t border-sand">
              <div className="space-y-4">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-primary">Sobre esta prenda</h3>
                <p className="text-foreground/80 leading-relaxed font-light text-lg">
                  {product.description || "Esta prenda exclusiva está lista para una segunda vida. Calidad garantizada por ModaCircular."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-8 py-6 bg-white/40 rounded-2xl px-8 border border-sand/30 shadow-inner">
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted mb-1">Talla</h4>
                  <p className="text-sm font-bold text-primary uppercase">{product.size || 'M'}</p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted mb-1">Estado</h4>
                  <p className="text-sm font-bold text-primary uppercase">{product.condition}</p>
                </div>
              </div>

              <div className="flex flex-col gap-4 pt-4">
                <AddToCartButton product={product} />
                <div className="flex items-center justify-center gap-3 text-muted text-[10px] font-bold uppercase tracking-widest">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
                  Garantía de Autenticidad
                </div>
              </div>
            </div>

            <div className="mt-auto pt-10 border-t border-sand/30 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary text-cream flex items-center justify-center font-serif font-bold">
                MC
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Curado por</p>
                <p className="text-sm font-bold text-primary">ModaCircular Premium</p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
