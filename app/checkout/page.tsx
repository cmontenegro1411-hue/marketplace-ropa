'use client';

import React, { useState } from 'react';
import { Container } from '@/components/ui/Container';
import { Navbar } from '@/components/ui/Navbar';
import { useCart } from '@/context/CartContext';
import Link from 'next/link';
import { completePurchase } from '@/app/actions/product-actions';

export default function CheckoutPage() {
  const { cart, totalPrice, clearCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setError(null);

    try {
      // Obtenemos los IDs de todos los productos en el carrito
      const productIds = cart.map(item => item.id);

      // *** LA ACCIÓN REAL: Actualiza status='sold' en Supabase ***
      const result = await completePurchase(productIds);

      if (!result.success) {
        setError(result.error || 'Error al procesar la compra.');
        setIsProcessing(false);
        return;
      }

      // Solo si la BD respondió OK, limpiamos el carrito y mostramos éxito
      clearCart();
      setIsSuccess(true);

    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado.');
      setIsProcessing(false);
    }
  };

  // Pantalla de Éxito (reemplaza el alert())
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-8 border-2 border-green-200 shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <h1 className="text-4xl font-serif font-bold text-primary mb-3">¡Pedido Confirmado!</h1>
          <p className="text-muted mb-2 leading-relaxed">
            Los productos han sido marcados como <strong className="text-primary">Vendidos</strong> en el sistema.
          </p>
          <p className="text-xs text-muted/60 uppercase tracking-widest mb-10">
            Pago simulado · Sin pasarela real
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/search"
              className="px-8 py-3 bg-primary text-cream rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-primary/90 transition-all shadow-md"
            >
              Seguir Comprando
            </Link>
            <Link
              href="/profile"
              className="px-8 py-3 border border-sand rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-cream transition-all"
            >
              Ver Mi Closet
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted mb-4">Tu carrito está vacío.</p>
          <Link href="/search" className="text-primary font-bold underline">Explorar catálogo</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      <Container className="py-12 lg:py-20">
        <div className="max-w-4xl mx-auto">
          <header className="mb-12 text-center">
            <h1 className="text-4xl font-serif font-bold text-primary mb-2">Finalizar Pedido</h1>
            <p className="text-muted italic">Estás a un paso de darle una nueva vida a estas prendas.</p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-12">
            {/* FORMULARIO */}
            <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 md:p-12 rounded-[2.5rem] border border-sand shadow-xl">

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700 font-medium">
                  ⚠️ {error}
                </div>
              )}

              <section className="space-y-6">
                <h2 className="text-xl font-serif font-bold text-primary border-b border-sand pb-4">Información de Envío</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted ml-2">Nombre Completo</label>
                    <input
                      required
                      type="text"
                      className="w-full bg-cream/30 border border-sand rounded-2xl py-3 px-4 focus:ring-1 focus:ring-primary outline-none"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted ml-2">Email</label>
                    <input
                      required
                      type="email"
                      className="w-full bg-cream/30 border border-sand rounded-2xl py-3 px-4 focus:ring-1 focus:ring-primary outline-none"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted ml-2">Dirección de Entrega</label>
                  <input
                    required
                    type="text"
                    placeholder="Calle, número, apto..."
                    className="w-full bg-cream/30 border border-sand rounded-2xl py-3 px-4 focus:ring-1 focus:ring-primary outline-none"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                  />
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-xl font-serif font-bold text-primary border-b border-sand pb-4">Método de Pago (Simulado)</h2>
                <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-10 h-6 bg-primary rounded-md shadow-sm"></div>
                    <span className="text-sm font-bold text-primary">Tarjeta de Crédito / Débito</span>
                  </div>
                  <input
                    disabled
                    type="text"
                    className="w-full bg-white border border-sand rounded-xl py-3 px-4 text-muted cursor-not-allowed"
                    value="xxxx xxxx xxxx xxxx"
                  />
                  <p className="text-[9px] text-muted mt-2 uppercase tracking-widest">* En este prototipo no se procesan pagos reales.</p>
                </div>
              </section>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-5 bg-primary text-cream rounded-full text-sm font-bold uppercase tracking-widest shadow-xl hover:bg-primary/90 hover:scale-[1.01] transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
              >
                {isProcessing
                  ? '⏳ Registrando venta en base de datos...'
                  : `Confirmar Pedido · S/ ${totalPrice.toLocaleString()}`
                }
              </button>
            </form>

            {/* RESUMEN LATERAL */}
            <aside className="space-y-6 h-fit sticky top-32">
              <div className="bg-sand/20 rounded-3xl p-6 border border-sand/50">
                <h3 className="text-xs font-bold uppercase tracking-widest text-primary mb-4">Tu Pedido ({cart.length} prendas)</h3>
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                  {cart.map(item => (
                    <div key={item.id} className="flex gap-3">
                      <img src={item.imageUrl} className="w-10 h-14 bg-white rounded-lg object-cover shadow-sm" alt={item.title} />
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-primary truncate">{item.title}</p>
                        <p className="text-[10px] text-muted font-serif font-bold">S/ {item.price.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-4 border-t border-sand flex justify-between items-baseline">
                  <span className="text-xs font-bold text-muted uppercase tracking-widest">Total</span>
                  <span className="text-2xl font-serif font-bold text-primary">S/ {totalPrice.toLocaleString()}</span>
                </div>
              </div>
              <p className="text-center text-[10px] text-muted px-4 leading-relaxed">
                Al confirmar aceptas nuestros términos de servicio y política de moda circular.
              </p>
            </aside>
          </div>
        </div>
      </Container>
    </div>
  );
}
