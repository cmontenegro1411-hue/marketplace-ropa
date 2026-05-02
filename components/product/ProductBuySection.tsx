'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import { ShoppingBag, CreditCard } from 'lucide-react';

interface ProductBuySectionProps {
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

export const ProductBuySection = ({ product }: ProductBuySectionProps) => {
  const { addToCart, cart } = useCart();
  const router = useRouter();
  const [isAdding, setIsAdding] = useState(false);

  const isInCart = cart.some(item => item.id === product.id);
  const isSold = product.status === 'sold';
  const isReserved = product.status === 'reserved';
  const isNotAvailable = isSold || isReserved;

  const handleAddToCart = () => {
    if (isNotAvailable || isInCart) return;
    
    setIsAdding(true);
    addToCart({
      id: product.id,
      title: product.title,
      price: product.price,
      imageUrl: product.images?.[0] || '/placeholder-product.png',
      brand: product.brand,
      size: product.size || 'M',
    });
    
    setTimeout(() => {
      setIsAdding(false);
    }, 500);
  };

  const handleBuyNow = () => {
    if (isNotAvailable) return;
    
    // Si no está en el carrito, añadirlo
    if (!isInCart) {
      addToCart({
        id: product.id,
        title: product.title,
        price: product.price,
        imageUrl: product.images?.[0] || '/placeholder-product.png',
        brand: product.brand,
        size: product.size || 'M',
      });
    }
    
    // Redirigir al checkout dinámico
    router.push('/checkout');
  };

  if (isNotAvailable) {
    return (
      <div className="bg-sand/30 p-6 rounded-2xl border border-sand text-center">
        <p className="text-primary font-serif font-bold text-lg">
          {isReserved ? 'Artículo Reservado' : 'Artículo Vendido'}
        </p>
        <p className="text-xs text-muted mt-1 font-medium">
          Esta prenda ya no está disponible para la compra.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-6">
      <div className="flex flex-col gap-3">
        {/* Botón Comprar Ahora - Prioridad alta */}
        <Button 
          size="lg" 
          fullWidth 
          onClick={handleBuyNow}
          className="bg-primary text-cream hover:bg-primary/90 shadow-lg"
        >
          <CreditCard className="w-4 h-4 mr-2" />
          Comprar Ahora
        </Button>

        {/* Botón Añadir al Carrito - Secundario */}
        <Button 
          variant="outline" 
          size="lg" 
          fullWidth 
          onClick={handleAddToCart}
          disabled={isInCart || isAdding}
          className={isInCart ? "border-green-200 bg-green-50 text-green-700" : ""}
        >
          {isAdding ? (
            <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin mr-2" />
          ) : isInCart ? (
            <ShoppingBag className="w-4 h-4 mr-2" />
          ) : (
            <ShoppingBag className="w-4 h-4 mr-2" />
          )}
          {isInCart ? 'En tu Bolsa' : 'Añadir al Carrito'}
        </Button>

      </div>
    </div>
  );
};
