'use client';

import React from 'react';
import { Navbar } from "@/components/ui/Navbar";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { ProductGallery } from "@/components/product/ProductGallery";
import { SellerInfo } from "@/components/product/SellerInfo";

// Mock Product Details
const PRODUCT = {
  id: 'uuid-123',
  title: 'Nike Air Max 270 - Blue Gradient Edition',
  price: 125.00,
  currency: 'USD',
  category: 'Footwear',
  brand: 'Nike',
  size: '10.5 US',
  condition: 'Muy buen estado',
  description: 'Zapatillas Nike Air Max 270 originales en una edición especial de gradiente azul. Han sido usadas muy poco y están en excelentes condiciones, sin marcas de desgaste en la suela. Estilo cómodo y moderno, ideal para uso diario o colección.',
  impact: {
    water: '1,200L',
    co2: '15kg',
  },
  seller: {
    name: 'Sofia V.',
    rating: 4.9,
    salesCount: 42,
    location: 'Barcelona, ES',
    isVerified: true,
  },
  images: Array(5).fill(''),
};

export default function ProductDetailPage() {
  return (
    <main className="min-h-screen bg-cream">
      <Navbar />

      <Container className="py-12">
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-16">
          
          {/* Left Column: Gallery */}
          <div>
            <ProductGallery images={PRODUCT.images} />
            
            {/* Sustainability Impact - Desktop */}
            <div className="hidden lg:flex mt-12 bg-primary/5 rounded-3xl p-8 border border-primary/10 items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 10v4a5 5 0 0 1-10 0v-4"/><path d="M11 20H4a8 8 0 0 1 0-16h7"/></svg>
                </div>
                <div>
                  <h4 className="font-bold text-foreground">Impacto Positivo</h4>
                  <p className="text-xs text-muted leading-tight">Al comprar esta pieza, ahorraste:</p>
                </div>
              </div>
              <div className="flex gap-8">
                <div className="text-center">
                  <p className="text-xl font-serif font-bold text-primary">{PRODUCT.impact.water}</p>
                  <p className="text-[10px] uppercase font-bold text-muted">Agua</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-serif font-bold text-primary">{PRODUCT.impact.co2}</p>
                  <p className="text-[10px] uppercase font-bold text-muted">CO2</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Info & Actions */}
          <div className="space-y-10">
            {/* Header Info */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-muted">{PRODUCT.brand}</span>
                <button className="text-muted hover:text-secondary transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                </button>
              </div>
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground leading-tight">
                {PRODUCT.title}
              </h1>
              <div className="flex items-center gap-6">
                <div className="text-4xl font-serif font-bold text-primary">${PRODUCT.price}</div>
                <div className="px-4 py-1.5 rounded-full bg-sand text-xs font-bold uppercase tracking-wider text-muted">
                  {PRODUCT.condition}
                </div>
              </div>
            </div>

            {/* Sizes & Details Grid */}
            <div className="grid grid-cols-2 gap-4 py-6 border-y border-sand">
              <div>
                <p className="text-[10px] uppercase font-bold text-muted mb-1">Talla</p>
                <p className="text-lg font-bold text-foreground">{PRODUCT.size}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-muted mb-1">Categoría</p>
                <p className="text-lg font-bold text-foreground">{PRODUCT.category}</p>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-primary">Descripción</h4>
              <p className="text-muted leading-relaxed">
                {PRODUCT.description}
              </p>
            </div>

            {/* Buy Section */}
            <div className="space-y-4 pt-6">
              <Button 
                size="lg" 
                fullWidth 
                onClick={() => window.location.href = `/checkout/${PRODUCT.id}`}
              >
                Comprar Ahora
              </Button>
              <Button variant="outline" size="lg" fullWidth>Hacer una Oferta</Button>
              
              <div className="flex items-center justify-center gap-6 pt-4">
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10"/></svg>
                  <span className="text-[10px] font-bold uppercase tracking-tighter text-muted">Pago Seguro</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
                  <span className="text-[10px] font-bold uppercase tracking-tighter text-muted">Protección 24h</span>
                </div>
              </div>
            </div>

            {/* Seller Info Section */}
            <div className="pt-10">
              <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-6">Información del Vendedor</h4>
              <SellerInfo {...PRODUCT.seller} />
            </div>

          </div>
        </div>
      </Container>
    </main>
  );
}
