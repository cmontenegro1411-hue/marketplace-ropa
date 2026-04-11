'use client';

import React, { useState } from 'react';
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

// Mock Product for Checkout
const CHECKOUT_ITEM = {
  id: '1',
  title: 'Nike Air Max 270 - Blue Gradient',
  brand: 'Nike',
  price: 125.00,
  shipping: 8.50,
  fee: 5.20,
};

const CheckoutPage = () => {
  const [step, setStep] = useState(1); // 1: Shipping, 2: Payment
  const total = CHECKOUT_ITEM.price + CHECKOUT_ITEM.shipping + CHECKOUT_ITEM.fee;

  return (
    <main className="min-h-screen bg-cream py-10 md:py-20">
      <Container className="max-w-5xl">
        {/* Simple Header */}
        <div className="flex items-center gap-4 mb-12">
          <button onClick={() => window.history.back()} className="text-muted hover:text-primary transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <h1 className="text-3xl font-serif font-bold text-primary italic">Checkout</h1>
        </div>

        <div className="grid lg:grid-cols-12 gap-16">
          {/* Main Content: Forms */}
          <div className="lg:col-span-7 space-y-12">
            
            {/* Step 1: Shipping */}
            <section className={`transition-all ${step === 2 ? 'opacity-40 pointer-events-none' : ''}`}>
              <div className="flex iems-center gap-4 mb-8">
                <span className="w-8 h-8 rounded-full bg-primary text-cream flex items-center justify-center font-bold text-sm">1</span>
                <h2 className="text-xl font-bold text-foreground">Dirección de Envío</h2>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted">Nombre Completo</label>
                  <input type="text" className="w-full bg-white border border-sand rounded-xl px-4 py-3 text-sm focus:border-primary focus:outline-none" placeholder="Sofia Velasquez" />
                </div>
                <div className="col-span-2 space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted">Dirección</label>
                  <input type="text" className="w-full bg-white border border-sand rounded-xl px-4 py-3 text-sm focus:border-primary focus:outline-none" placeholder="Calle de la Sostenibilidad 123" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted">Ciudad</label>
                  <input type="text" className="w-full bg-white border border-sand rounded-xl px-4 py-3 text-sm focus:border-primary focus:outline-none" placeholder="Madrid" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted">Código Postal</label>
                  <input type="text" className="w-full bg-white border border-sand rounded-xl px-4 py-3 text-sm focus:border-primary focus:outline-none" placeholder="28001" />
                </div>
              </div>
              
              {step === 1 && (
                <div className="mt-10">
                  <Button onClick={() => setStep(2)} fullWidth>Continuar al Pago</Button>
                </div>
              )}
            </section>

            {/* Step 2: Payment */}
            <section className={`transition-all ${step === 1 ? 'opacity-20 pointer-events-none' : ''}`}>
              <div className="flex items-center gap-4 mb-8">
                <span className="w-8 h-8 rounded-full bg-primary text-cream flex items-center justify-center font-bold text-sm">2</span>
                <h2 className="text-xl font-bold text-foreground">Método de Pago</h2>
              </div>

              <div className="bg-white border border-sand rounded-3xl p-8 space-y-6">
                <div className="flex items-center justify-between p-4 border border-primary bg-primary/5 rounded-2xl">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-6 bg-sand rounded flex items-center justify-center text-[8px] font-bold italic">CARD</div>
                    <span className="text-sm font-bold">Tarjeta de Crédito / Débito</span>
                  </div>
                  <div className="w-4 h-4 rounded-full border-4 border-primary" />
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted">Número de Tarjeta</label>
                    <input type="text" className="w-full bg-cream/20 border border-sand rounded-xl px-4 py-3 text-sm focus:border-primary focus:outline-none" placeholder="•••• •••• •••• ••••" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted">Expira</label>
                      <input type="text" className="w-full bg-cream/20 border border-sand rounded-xl px-4 py-3 text-sm focus:border-primary focus:outline-none" placeholder="MM/YY" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted">CVC</label>
                      <input type="text" className="w-full bg-cream/20 border border-sand rounded-xl px-4 py-3 text-sm focus:border-primary focus:outline-none" placeholder="***" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-10 space-y-4">
                <Button size="lg" fullWidth>Pagar ${total.toFixed(2)}</Button>
                <button onClick={() => setStep(1)} className="w-full text-xs font-bold text-muted uppercase tracking-widest hover:text-primary transition-colors">Volver a envío</button>
              </div>
            </section>
          </div>

          {/* Sidebar: Order Summary */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-4xl p-10 border border-sand shadow-sm sticky top-10">
              <h3 className="text-lg font-serif font-bold text-primary mb-8 underline underline-offset-8">Resumen de tu Compra</h3>
              
              <div className="flex gap-6 mb-8">
                <div className="w-24 aspect-[3/4] bg-sand rounded-xl overflow-hidden flex-shrink-0" />
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase text-muted">{CHECKOUT_ITEM.brand}</p>
                  <p className="font-bold text-foreground leading-tight">{CHECKOUT_ITEM.title}</p>
                  <p className="text-sm text-primary font-bold">${CHECKOUT_ITEM.price.toFixed(2)}</p>
                </div>
              </div>

              <div className="space-y-4 pb-8 border-b border-sand">
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Subtotal</span>
                  <span className="font-medium">${CHECKOUT_ITEM.price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Envío Estándar</span>
                  <span className="font-medium">${CHECKOUT_ITEM.shipping.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted">Tarifa de Protección</span>
                    <div className="w-3 h-3 rounded-full border border-muted text-[8px] flex items-center justify-center text-muted">?</div>
                  </div>
                  <span className="font-medium">${CHECKOUT_ITEM.fee.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-8">
                <span className="text-xl font-serif font-bold text-primary italic">Total</span>
                <span className="text-2xl font-serif font-bold text-primary">${total.toFixed(2)}</span>
              </div>

              {/* Trust badges */}
              <div className="mt-12 bg-cream rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-secondary" />
                  <p className="text-[10px] font-bold uppercase tracking-tighter text-muted">Pago 100% Protegido por Antigravity</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-secondary" />
                  <p className="text-[10px] font-bold uppercase tracking-tighter text-muted">Soporte 24/7 en caso de discrepancias</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </main>
  );
};

export default CheckoutPage;
