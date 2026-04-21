'use client';

import React, { useState } from 'react';
import { Container } from '@/components/ui/Container';
import { Navbar } from '@/components/ui/Navbar';
import { useCart } from '@/context/CartContext';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { completePurchase } from '@/app/actions/product-actions';
import { initMercadoPago, Wallet } from '@mercadopago/sdk-react';

if (process.env.NEXT_PUBLIC_MP_PUBLIC_KEY) {
  initMercadoPago(process.env.NEXT_PUBLIC_MP_PUBLIC_KEY);
}

export default function CheckoutPage() {
  const { cart, totalPrice, clearCart } = useCart();
  const { data: session } = useSession();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contacts, setContacts] = useState<any[]>([]);
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
  };
  
  const handleBypassPurchase = async () => {
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
      const result = await completePurchase(cart.map(i => i.id), formData);
      if (result.success) {
        setIsSuccess(true);
        setContacts(result.contacts || []);
        clearCart();
      } else {
        throw new Error(result.error || 'Error en Bypass');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Pantalla de Éxito (Reserva P2P)
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#FBF9F6] flex items-center justify-center p-8 pt-20">
        <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-sand max-w-2xl w-full text-center animate-fade-in-up">
          <div className="w-24 h-24 rounded-full bg-accent text-cream flex items-center justify-center mx-auto mb-8 shadow-lg">
             <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-primary mb-4">¡Prendas Reservadas!</h1>
          <p className="text-muted text-lg leading-relaxed mb-4">
            Hemos bloqueado estas prendas en el sistema para que nadie más pueda llevárselas.
          </p>
          <div className="bg-sand/30 p-6 rounded-2xl mb-8">
             <p className="text-sm font-bold text-primary mb-2">Siguiente Paso Obligatorio:</p>
             <p className="text-xs text-muted mb-4">Haz clic en los botones de abajo para abrir WhatsApp y conversar directamente con el vendedor (o vendedores) de tus prendas. Coordina con ellos el pago contraentrega y la dirección local.</p>
             
             <div className="flex flex-col gap-3 text-left">
                {contacts.length > 0 ? contacts.map((seller, idx) => {
                  const number = seller.whatsapp || "51999888777";
                  // Formulando el mensaje amigable
                  const msg = encodeURIComponent(`¡Hola ${seller.sellerName}! Acabo de reservar ${seller.productCount} prenda(s) tuya(s) por S/ ${seller.totalAmount.toLocaleString()} en la plataforma de Moda Circular. (${seller.productsList}). Quisiera coordinar la contraentrega contigo.`);
                  const waLink = `https://wa.me/${number}?text=${msg}`;

                  return (
                    <a key={idx} href={waLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-white hover:bg-[#25D366]/10 border border-[#25D366]/30 rounded-xl transition-all group">
                       <div>
                         <p className="text-sm font-bold text-primary">Vendedor: {seller.sellerName}</p>
                         <p className="text-[10px] uppercase tracking-widest text-muted">{seller.productCount} prendas • S/ {seller.totalAmount.toLocaleString()}</p>
                       </div>
                       <div className="bg-[#25D366] text-white p-2.5 rounded-full group-hover:scale-110 transition-transform">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M11.996 0A12 12 0 000 12c0 2.112.553 4.218 1.635 6.06L.01 24l6.096-1.597A11.964 11.964 0 0011.996 24 12 12 0 0024 12 12 0 0011.996 0zm6.545 17.15c-.292.833-1.42 1.574-2.193 1.616-.628.03-1.428-.15-2.527-.604-4.216-1.745-6.936-6.074-7.143-6.353-.207-.278-1.705-2.274-1.705-4.34 0-2.067 1.07-3.085 1.455-3.5.353-.38 1.05-.595 1.536-.595.143 0 .27.006.38.013.38.018.57.037.82.639.317.763 1.082 2.65 1.176 2.842.095.192.16.417.065.61-.095.192-.143.313-.284.475-.14.162-.294.354-.423.493-.143.14-.294.293-.13.578.163.284.723 1.198 1.55 1.936 1.066.953 1.956 1.25 2.15 1.346.195.096.31.082.427-.053.116-.135.5-58.58-.727.784-.81.282-.027 1.306-2.5 1.44-4.887 2.05zm0 0"/></svg>
                       </div>
                    </a>
                  )
                }) : (
                   <p className="text-xs text-muted">No se pudo recuperar la información de contacto.</p>
                )}
             </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-sand">
             <Link
               href="/search"
               className="inline-block px-8 py-4 bg-primary text-cream rounded-full text-xs font-bold uppercase tracking-widest hover:bg-opacity-90 transition-all shadow-md"
             >
               Volver al catálogo
             </Link>
          </div>
        </div>
      </div>
    );
  }

  if (cart.length === 0 && !isSuccess) {
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
            <h1 className="text-4xl font-serif font-bold text-primary mb-2">Checkout P2P Escrow</h1>
            <p className="text-muted italic max-w-lg mx-auto">Ingresa tus datos y procesa el pago a través de Mercado Pago. Los fondos se liberarán al vendedor sólo cuando indiques conformidad de recepción.</p>
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
                    preferenceId={preferenceId} 
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
                <div className="pt-4 border-t border-dashed border-sand">
                  <button
                    type="button"
                    onClick={handleBypassPurchase}
                    disabled={isProcessing}
                    className="w-full py-4 bg-accent/10 text-accent border-2 border-accent border-dashed rounded-full text-xs font-bold uppercase tracking-widest hover:bg-accent/20 transition-all flex items-center justify-center gap-2"
                  >
                    🧪 SIMULAR COMPRA SIN PAGO (BYPASS MP)
                  </button>
                  <p className="text-[9px] text-center text-accent mt-2 font-mono uppercase">
                    Modo Debug Activo: Salta la pasarela y procesa directo
                  </p>
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
    </div>
  );
}
