'use client';

import React, { useState } from 'react';
import { Container } from '@/components/ui/Container';
import { Navbar } from '@/components/ui/Navbar';
import { useCart } from '@/context/CartContext';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { completePurchase } from '@/app/actions/product-actions';
import { initMercadoPago, Wallet } from '@mercadopago/sdk-react';

if (process.env.NEXT_PUBLIC_MP_PUBLIC_KEY) {
  initMercadoPago(process.env.NEXT_PUBLIC_MP_PUBLIC_KEY);
}

export default function CheckoutPage() {
  const { cart, totalPrice, clearCart } = useCart();
  const { data: _session } = useSession();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Procesando pago seguro...');
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    emailConfirm: '', // Nuevo campo para validación
    buyer_phone: '',
    address: '',
  });
  const [preferenceId, setPreferenceId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setLoadingMessage('Preparando pasarela de pago...');
    setError(null);
    try {
      // Nueva validación de email
      if (formData.email !== formData.emailConfirm) {
        throw new Error('Los correos electrónicos no coinciden.');
      }

      const response = await fetch('/api/checkout/preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          items: cart, 
          buyerInfo: formData 
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error al crear la preferencia');

      setPreferenceId(data.id);
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado.');
    } finally {
      setIsProcessing(false);
    }
  };  const handleBypassPurchase = async () => {
    setIsProcessing(true);
    setError(null);

    // Validación manual de Bypass antes de proceder
    if (!formData.name || !formData.email || !formData.buyer_phone) {
      setError("Por favor completa Nombre, Email y WhatsApp antes de simular la compra.");
      setIsProcessing(false);
      return;
    }

    if (formData.email !== formData.emailConfirm) {
      setError("Los correos electrónicos no coinciden.");
      setIsProcessing(false);
      return;
    }

    try {
      setLoadingMessage('Simulando transacción segura...');
      const result = await completePurchase(cart.map(i => i.id), formData);
      
      if (result.success) {
        setLoadingMessage('¡Pago exitoso! Redirigiendo...');
        clearCart();
        // Soft navigation con router.push para evitar parpadeos
        router.push(`/checkout/success?payment_id=bypass_${Date.now()}&status=approved`);
      } else {
        throw new Error(result.error || 'Error en Bypass');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted mb-4">Aún no has seleccionado ninguna prenda.</p>
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
             <div className="inline-block px-4 py-1.5 border border-primary/20 rounded-full mb-4 bg-white">
               <span className="text-primary font-bold tracking-[0.5em] uppercase text-[9px]">Pago 100% Seguro</span>
            </div>
            <h1 className="text-4xl font-serif font-bold text-primary mb-2">Finalizar Compra</h1>
            <p className="text-muted italic max-w-lg mx-auto">Tu pago está protegido. Los fondos se mantienen en custodia segura y se liberan al vendedor únicamente tras tu confirmación de recepción.</p>
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
                 <div className="flex items-center gap-3 border-b border-sand pb-4">
                     <span className="flex items-center justify-center w-8 h-8 rounded-full bg-cream text-primary font-bold">1</span>
                     <h2 className="text-xl font-serif font-bold text-primary">Tus Datos de Contacto</h2>
                 </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted ml-2">¿Cómo te llamas?</label>
                    <input
                      required
                      type="text"
                      placeholder="Ej. Camila"
                      className="w-full bg-cream/30 border border-sand rounded-2xl py-3 px-4 focus:ring-1 focus:ring-primary outline-none"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted ml-2">Tu número de WhatsApp</label>
                    <input
                      required
                      type="tel"
                      pattern="[0-9]*"
                      placeholder="Ej. 999888777"
                      className="w-full bg-cream/30 border border-sand rounded-2xl py-3 px-4 focus:ring-1 focus:ring-primary outline-none"
                      value={formData.buyer_phone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, ''); // Solo números
                        setFormData({...formData, buyer_phone: val});
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted ml-2">Email para recibo</label>
                    <input
                      required
                      type="email"
                      placeholder="correo@ejemplo.com"
                      className="w-full bg-cream/30 border border-sand rounded-2xl py-3 px-4 focus:ring-1 focus:ring-primary outline-none"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted ml-2">Confirmar Email</label>
                    <input
                      required
                      type="email"
                      placeholder="Repite tu correo"
                      className={`w-full bg-cream/30 border border-sand rounded-2xl py-3 px-4 focus:ring-1 outline-none ${
                        formData.emailConfirm && formData.email !== formData.emailConfirm 
                        ? 'border-red-400 focus:ring-red-400' 
                        : 'focus:ring-primary'
                      }`}
                      value={formData.emailConfirm}
                      onChange={(e) => setFormData({...formData, emailConfirm: e.target.value})}
                    />
                    {formData.emailConfirm && formData.email !== formData.emailConfirm && (
                      <p className="text-[9px] text-red-500 font-bold ml-2 uppercase">Los correos no coinciden</p>
                    )}
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                 <div className="flex items-center gap-3 border-b border-sand pb-4">
                     <span className="flex items-center justify-center w-8 h-8 rounded-full bg-accent text-white font-bold">2</span>
                     <h2 className="text-xl font-serif font-bold text-primary">Método de Pago Seguro</h2>
                 </div>
              </section>

              {preferenceId ? (
                <div className="animate-in fade-in zoom-in duration-500">
                  <Wallet 
                    initialization={{ preferenceId: preferenceId }}
                    customization={{ 
                      visual: { 
                        buttonBackground: 'black',
                        borderRadius: '24px',
                      }
                    } as any} 
                  />
                  <p className="text-[10px] text-center text-muted mt-4 uppercase tracking-widest">
                    Pago 100% seguro procesado por Mercado Pago
                  </p>
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-5 bg-primary text-cream rounded-full text-base font-bold uppercase tracking-widest shadow-xl hover:bg-primary/90 hover:scale-[1.01] transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center gap-2"
                >
                  {isProcessing
                    ? '⏳ Preparando pasarela segura...'
                    : `Proceder al Pago · S/ ${totalPrice.toLocaleString()}`
                  }
                </button>
              )}

              {/* OPCIÓN BYPASS (SOLO DESARROLLO) */}
              {process.env.NEXT_PUBLIC_ALLOW_DEBUG_BYPASS === 'true' && (
                <div className="pt-4 border-t border-dashed border-sand flex flex-col items-center">
                  <button
                    type="button"
                    onClick={handleBypassPurchase}
                    disabled={isProcessing}
                    className="text-[10px] text-accent/60 hover:text-accent font-bold uppercase tracking-widest transition-all py-2 px-4 rounded-lg border border-transparent hover:border-accent/20"
                  >
                    🧪 Bypass para pruebas
                  </button>
                </div>
              )}
            </form>

            {/* RESUMEN LATERAL */}
            <aside className="space-y-6 h-fit sticky top-32">
              <div className="bg-sand/20 rounded-3xl p-6 border border-sand/50">
                <h3 className="text-xs font-bold uppercase tracking-widest text-primary mb-4">Tu carrito ({cart.length} prendas)</h3>
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 mb-4">
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
                <div className="mt-4 pt-4 border-t border-sand flex justify-between items-baseline">
                  <span className="text-xs font-bold text-muted uppercase tracking-widest">Total a Pagar</span>
                  <span className="text-3xl font-serif font-bold text-accent">S/ {totalPrice.toLocaleString()}</span>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </Container>

      {/* OVERLAY DE CARGA PREMIUM */}
      {isProcessing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-cream/90 backdrop-blur-md animate-in fade-in duration-500">
          <div className="text-center space-y-6 max-w-xs animate-in zoom-in slide-in-from-bottom-4 duration-700">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-primary/10 border-t-accent rounded-full animate-spin mx-auto"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-serif font-bold text-primary">{loadingMessage}</h3>
              <p className="text-[10px] text-muted uppercase tracking-[0.2em] font-bold">Seguridad Cifrada • Moda Circular</p>
            </div>
            <div className="pt-4">
               <p className="text-[9px] text-muted italic">No cierres esta ventana mientras aseguramos tus prendas.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
