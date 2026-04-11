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

  // Estado: VENDIDO — bloqueo total
  if (isSold) {
    return (
      <div className="w-full py-5 rounded-full bg-sand border-2 border-sand text-center cursor-not-allowed">
        <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-muted">
          Este producto ya fue vendido
        </span>
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
