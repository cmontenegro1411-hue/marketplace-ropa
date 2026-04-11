'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useCart } from '@/context/CartContext';

interface AddToCartButtonProps {
  product: {
    id: string;
    title: string;
    price: number;
    images: string[];
    brand: string;
    size: string;
    status?: string;
  };
}

export const AddToCartButton = ({ product }: AddToCartButtonProps) => {
  const { addToCart, cart } = useCart();
  const [isAdding, setIsAdding] = useState(false);

  const isInCart = cart.some(item => item.id === product.id);
  const isSold = product.status === 'sold';

  const handleAdd = () => {
    if (isSold) return; // Doble protección: no hacer nada si está vendido
    setIsAdding(true);
    setTimeout(() => {
      addToCart({
        id: product.id,
        title: product.title,
        price: product.price,
        imageUrl: product.images?.[0] || '/placeholder-product.png',
        brand: product.brand,
        size: product.size || 'M',
      });
      setIsAdding(false);
    }, 400);
  };

  // Estado: VENDIDO — bloqueo total con diseño premium
  if (isSold) {
    return (
      <div className="w-full space-y-3">
        {/* Banner principal */}
        <div className="w-full flex items-center justify-center gap-3 py-5 px-6 rounded-2xl bg-secondary/10 border-2 border-secondary/30">
          {/* Icono de candado */}
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-secondary shrink-0">
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <div className="text-left">
            <p className="text-sm font-bold text-secondary tracking-tight">Esta prenda ya encontró dueño</p>
            <p className="text-[10px] text-secondary/70 font-medium uppercase tracking-widest">Producto no disponible</p>
          </div>
        </div>
        {/* Sugerencia de acción */}
        <a
          href="/search"
          className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-2xl border border-sand text-[10px] font-bold uppercase tracking-widest text-muted hover:text-primary hover:border-primary/30 hover:bg-cream transition-all duration-300"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          Ver prendas similares
        </a>
      </div>
    );
  }

  return (
    <Button 
      disabled={isInCart || isAdding}
      onClick={handleAdd}
      style={{ opacity: 1 }} 
      className={`w-full py-8 text-lg rounded-full shadow-lg transition-all duration-300 flex items-center justify-center gap-3 !opacity-100 ${
        isInCart 
          ? '!bg-[#1A1A1A] !text-white !cursor-default' 
          : 'bg-primary text-cream hover:bg-[#2A2A2A] hover:shadow-2xl'
      }`}
    >
      {isAdding ? (
        <>
          <div className="w-5 h-5 border-2 border-cream/30 border-t-cream rounded-full animate-spin" />
          <span>Añadiendo...</span>
        </>
      ) : isInCart ? (
        <>
          <div className="bg-white rounded-full p-1 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5"/>
            </svg>
          </div>
          <span className="font-bold tracking-widest text-[12px] uppercase">En tu Bolsa</span>
        </>
      ) : (
        "Añadir al Carrito"
      )}
    </Button>
  );
};
