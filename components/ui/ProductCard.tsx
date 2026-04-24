'use client';

import React from 'react';
import Link from 'next/link';
interface ProductCardProps {
  id: string;
  title: string;
  brand: string;
  size?: string;
  condition: string;
  price: number;
  imageUrl?: string;
  status?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  id,
  title,
  brand,
  size,
  condition,
  price,
  imageUrl,
  status
}) => {
  const conditionColors: { [key: string]: string } = {
    'Nuevo con etiqueta': 'bg-primary text-cream',
    'Muy buen estado': 'bg-primary/80 text-cream',
    'Buen estado': 'bg-accent text-white',
    'Con señales de uso': 'bg-secondary text-white',
  };

  const badgeColor = conditionColors[condition] || 'bg-sand text-muted';
  const cleanTitle = title ? title.replace(/<[^>]*>?/gm, '') : 'Producto';

  return (
    <Link href={`/product/${id}`} className="group cursor-pointer block card-hover">
      <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-sand mb-4 border border-sand/50 transition-all duration-700">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={cleanTitle}
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1594932224036-9c200170ad6b?q=80&w=800';
              (e.target as HTMLImageElement).onerror = null; 
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-sand to-cream flex items-center justify-center">
            <span className="text-muted/40 font-serif italic">Sin imagen</span>
          </div>
        )}
        
        <div className={`absolute top-4 left-4 px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-[0.15em] border border-white/20 backdrop-blur-md shadow-sm ${badgeColor}`}>
          {condition}
        </div>
        
        <button className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-white glass flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 shadow-xl translate-y-2 group-hover:translate-y-0 text-primary hover:scale-110 active:scale-95 z-20">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
        </button>

        {(status === 'reserved' || status === 'shipped') && (
          <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center pointer-events-none">
            <div className="bg-accent text-white px-6 py-2 border-2 border-white/20 shadow-2xl rotate-6 scale-110">
              <span className="text-xs font-bold uppercase tracking-[0.4em]">Reservado</span>
            </div>
          </div>
        )}

        {status === 'sold' && (
          <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center pointer-events-none">
            <div className="bg-primary text-cream px-6 py-2 border-2 border-cream/20 shadow-2xl -rotate-6 scale-110">
              <span className="text-xs font-bold uppercase tracking-[0.4em]">Vendido</span>
            </div>
          </div>
        )}
      </div>
      
      <div className="space-y-1.5 px-1">
        <div className="flex justify-between items-baseline">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">{brand}</p>
          <p className="font-serif font-bold text-lg text-primary tracking-tighter">S/ {price}</p>
        </div>
        <h3 className="text-base font-serif font-semibold text-primary/90 line-clamp-1 group-hover:text-accent transition-colors duration-500">
          {cleanTitle}
        </h3>
        {size && <p className="text-[11px] text-muted font-bold uppercase tracking-widest bg-sand/40 inline-block px-2 py-0.5 rounded">Talla: {size}</p>}
      </div>
    </Link>
  );
};
