'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface CartItem {
  id: string;
  title: string;
  price: number;
  imageUrl: string;
  brand: string;
  size: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

/**
 * Reglas de persistencia del carrito:
 * - Usuario ANÓNIMO  → sessionStorage  (se borra al cerrar pestaña/browser)
 * - Usuario LOGUEADO → localStorage con clave scoped al userId
 *                      (persiste entre visitas, pero aislado por cuenta)
 */
function getStorageKey(userId?: string | null): { storage: Storage | null; key: string } {
  if (typeof window === 'undefined') return { storage: null, key: '' };

  if (userId) {
    return { storage: window.localStorage, key: `cart_${userId}` };
  }
  return { storage: window.sessionStorage, key: 'cart_guest' };
}

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const { data: session, status } = useSession();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [initialized, setInitialized] = useState(false);

  const userId = session?.user?.id ?? null;

  // Cargar carrito cuando la sesión esté lista
  useEffect(() => {
    if (status === 'loading') return; // Esperar a que se resuelva la sesión

    const { storage, key } = getStorageKey(userId);
    if (!storage) return;

    try {
      const saved = storage.getItem(key);
      setCart(saved ? JSON.parse(saved) : []);
    } catch {
      setCart([]);
    } finally {
      setInitialized(true);
    }
  }, [status, userId]);

  // Guardar carrito en el storage correcto cada vez que cambia
  useEffect(() => {
    if (!initialized) return;

    const { storage, key } = getStorageKey(userId);
    if (!storage) return;

    storage.setItem(key, JSON.stringify(cart));
  }, [cart, initialized, userId]);

  const addToCart = (item: CartItem) => {
    // Ropa de segunda mano: solo 1 unidad por prenda
    if (!cart.some((i) => i.id === item.id)) {
      setCart([...cart, item]);
    }
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
  };

  const totalItems = cart.length;
  const totalPrice = cart.reduce((sum, item) => sum + item.price, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
