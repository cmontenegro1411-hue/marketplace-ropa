'use client';

import React from 'react';
import { Container } from '@/components/ui/Container';
import { Navbar } from '@/components/ui/Navbar';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default function CartPage() {
  const { cart, removeFromCart, totalPrice, totalItems } = useCart();

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      
      <Container className="py-12 lg:py-20">
        <header className="mb-12 border-b border-sand pb-10">
          <h1 className="text-4xl lg:text-5xl font-serif font-bold text-primary mb-2 tracking-tight">Tu Bolsa de Compras</h1>
          <p className="text-muted font-light">
            {totalItems === 0 
              ? "Tu bolsa está vacía actualmente." 
              : `Tienes ${totalItems} ${totalItems === 1 ? 'prenda seleccionada' : 'prendas seleccionadas'}.`}
          </p>
        </header>

        {cart.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-12 lg:gap-20">
            {/* LISTA DE PRODUCTOS */}
            <div className="space-y-6">
              {cart.map((item) => (
                <div key={item.id} className="flex gap-6 p-6 bg-white rounded-3xl border border-sand shadow-sm group hover:shadow-md transition-shadow">
                  <div className="w-24 h-32 md:w-32 md:h-40 bg-sand/30 rounded-2xl overflow-hidden flex-shrink-0">
                    <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 flex flex-col justify-between py-2">
                    <div>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-1">{item.brand}</p>
                          <h3 className="text-xl font-serif font-bold text-primary group-hover:text-secondary transition-colors">{item.title}</h3>
                          <p className="text-xs text-muted mt-1 uppercase tracking-wider">Talla: {item.size}</p>
                        </div>
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="text-muted hover:text-red-500 p-2 transition-colors"
                          title="Eliminar"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="text-2xl font-serif font-bold text-primary">S/ {item.price.toLocaleString()}</span>
                      <Link href={`/products/${item.id}`} className="text-[10px] font-bold uppercase tracking-widest text-secondary hover:underline">Ver detalle</Link>
                    </div>
                  </div>
                </div>
              ))}
              
              <Link href="/search" className="inline-block mt-4 text-sm font-bold text-primary hover:text-secondary transition-colors">
                &larr; Seguir comprando
              </Link>
            </div>

            {/* RESUMEN DE COMPRA */}
            <aside className="lg:sticky lg:top-32 h-fit">
              <div className="bg-white rounded-[2rem] p-8 border border-sand shadow-lg space-y-6">
                <h2 className="text-xl font-serif font-bold text-primary border-b border-sand pb-4">Resumen</h2>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Subtotal</span>
                    <span className="font-bold text-primary">S/ {totalPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted">Envío</span>
                    <span className="text-primary font-medium italic text-[11px] tracking-tight">Calculado al pagar</span>
                  </div>
                  <div className="pt-4 border-t border-sand flex justify-between items-baseline">
                    <span className="text-lg font-bold text-primary">Subtotal</span>
                    <div className="text-right">
                      <span className="text-3xl font-serif font-bold text-primary">S/ {totalPrice.toLocaleString()}</span>
                      <p className="text-[10px] text-muted uppercase tracking-widest mt-1">+ costo de envío</p>
                    </div>
                  </div>
                </div>

                <Link href="/checkout">
                  <Button className="w-full py-6 mt-4 rounded-full text-base shadow-lg hover:shadow-xl transition-all">
                    Finalizar Compra
                  </Button>
                </Link>
                <div className="pt-4 flex flex-col items-center justify-center gap-1 opacity-60">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    Reserva Segura
                  </span>
                  <span className="text-[9px] text-muted uppercase tracking-widest">Pago P2P Contraentrega</span>
                </div>
              </div>
            </aside>
          </div>
        ) : (
          <div className="py-32 text-center border-2 border-dashed border-sand rounded-[3rem] bg-white/40">
            <div className="mb-6 opacity-20 flex justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
            </div>
            <h2 className="text-2xl font-serif font-bold text-primary mb-2">Parece que aún no has encontrado nada</h2>
            <p className="text-muted mb-8 italic">Explora nuestras últimas prendas curadas y dale una nueva vida a la moda.</p>
            <Link href="/search">
              <Button size="lg" className="rounded-full px-12">Ir al Catálogo</Button>
            </Link>
          </div>
        )}
      </Container>
    </div>
  );
}
