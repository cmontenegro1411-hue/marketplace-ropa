'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Container } from '@/components/ui/Container';
import { Navbar } from '@/components/ui/Navbar';
import { useCart } from '@/context/CartContext';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { completePurchase } from '@/app/actions/product-actions';
import { getSellersByProductIds } from '@/app/actions/shipping-actions';
import { initMercadoPago, Wallet } from '@mercadopago/sdk-react';
import { UbigeoSelector } from '@/components/ui/UbigeoSelector';
import { ChevronRight, ChevronLeft, Truck, ShieldCheck, MapPin, User } from 'lucide-react';

if (process.env.NEXT_PUBLIC_MP_PUBLIC_KEY) {
  initMercadoPago(process.env.NEXT_PUBLIC_MP_PUBLIC_KEY);
}

export default function CheckoutPage() {
  const { cart, totalPrice, clearCart } = useCart();
  const { data: _session } = useSession();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sellersInfo, setSellersInfo] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    // Datos del Comprador (Quien paga)
    name: '',
    email: '',
    emailConfirm: '',
    buyer_phone: '',
    // Datos de Envío (Destinatario)
    shipping_name: '',
    shipping_phone: '',
    shipping_department: '',
    shipping_province: '',
    shipping_district: '',
    shipping_ubigeo: '',
    shipping_address: '',
  });

  const [preferenceId, setPreferenceId] = useState<string | null>(null);

  // 1. Cargar info de vendedores al iniciar
  useEffect(() => {
    async function loadSellers() {
      if (cart.length > 0) {
        const productIds = cart.map(i => i.id);
        const result = await getSellersByProductIds(productIds);
        if (result.success) {
          setSellersInfo(result.data || []);
        }
      }
    }
    loadSellers();
  }, [cart]);
  // 2. Calcular envío en tiempo real
  const shippingFee = useMemo(() => {
    if (!formData.shipping_ubigeo || sellersInfo.length === 0) {
      return 0;
    }
    
    const buyerUbigeo = formData.shipping_ubigeo.toString().trim().padStart(6, '0');
    const uniqueSellers = Array.from(new Set(sellersInfo.map(s => s.sellerId)));
    
    let totalFee = 0;
    uniqueSellers.forEach(sellerId => {
      const seller = sellersInfo.find(s => s.sellerId === sellerId);
      if (!seller) return;

      const sellerUbigeo = seller.ubigeoCode?.toString().trim().padStart(6, '0');
      const rates = seller.shippingRates;
      const defaultRates = { local: 10, regional: 15, national: 25 };

      console.log(`[Shipping Debug] Seller: ${sellerId}, Buyer Ubigeo: ${buyerUbigeo}, Seller Ubigeo: ${sellerUbigeo}`);
      console.log(`[Shipping Debug] Rates found:`, rates);

      if (!sellerUbigeo || sellerUbigeo === '000000') {
        const rate = (rates?.national !== undefined && rates?.national !== null) ? Number(rates.national) : defaultRates.national;
        totalFee += rate;
        return;
      }

      if (sellerUbigeo === buyerUbigeo) {
        // MISMO DISTRITO
        const rate = (rates?.local !== undefined && rates?.local !== null) ? Number(rates.local) : defaultRates.local;
        totalFee += rate;
      } else if (sellerUbigeo.substring(0, 2) === buyerUbigeo.substring(0, 2)) {
        // MISMO DEPARTAMENTO
        const rate = (rates?.regional !== undefined && rates?.regional !== null) ? Number(rates.regional) : defaultRates.regional;
        totalFee += rate;
      } else {
        // DIFERENTE DEPARTAMENTO (NACIONAL)
        const rate = (rates?.national !== undefined && rates?.national !== null) ? Number(rates.national) : defaultRates.national;
        totalFee += rate;
      }
    });
    
    return totalFee;
  }, [formData.shipping_ubigeo, sellersInfo]);

  const handleUbigeoSelect = React.useCallback((data: any) => {
    setFormData(prev => {
      // Evitar actualización si es el mismo ubigeo para prevenir loops
      if (prev.shipping_ubigeo === data.ubigeoCode) return prev;
      return {
        ...prev,
        shipping_department: data.department,
        shipping_province: data.province,
        shipping_district: data.district,
        shipping_ubigeo: data.ubigeoCode
      };
    });
  }, []);

  const finalTotal = totalPrice + shippingFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      if (formData.email !== formData.emailConfirm) {
        setError('Los correos electrónicos no coinciden.');
        return;
      }
      setStep(2);
      setError(null);
      return;
    }

    if (step === 2) {
      if (!formData.shipping_address || !formData.shipping_ubigeo || !formData.shipping_name || !formData.shipping_phone) {
        setError('Por favor, completa todos los datos de envío (Dirección, Departamento, Provincia y Distrito) antes de proceder al pago.');
        setIsProcessing(false);
        return;
      }
    }

    setIsProcessing(true);
    setError(null);
    try {
      const response = await fetch('/api/checkout/preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          items: cart, 
          buyerInfo: formData,
          shippingFee: shippingFee
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
    // Validar que los datos de envío estén completos antes de procesar
    if (!formData.shipping_address || !formData.shipping_ubigeo || !formData.name || !formData.buyer_phone) {
      setError('Por favor, completa todos los campos de contacto y envío antes de usar el bypass.');
      // Si estamos en el paso 1, quedarnos ahí. Si estamos en el 2, el mensaje aparecerá arriba.
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const result = await completePurchase(cart.map(i => i.id), formData, shippingFee);
      
      if (result.success) {
        clearCart();
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
        <div className="max-w-5xl mx-auto">
          
          {/* Progress Bar */}
          <div className="flex items-center justify-center mb-12 gap-4">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-primary' : 'text-muted'}`}>
              <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${step >= 1 ? 'bg-primary text-cream' : 'bg-sand text-muted'}`}>1</span>
              <span className="text-[10px] font-bold uppercase tracking-widest hidden md:block">Comprador</span>
            </div>
            <div className={`h-[2px] w-12 ${step >= 2 ? 'bg-primary' : 'bg-sand'}`} />
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-primary' : 'text-muted'}`}>
              <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${step >= 2 ? 'bg-primary text-cream' : 'bg-sand text-muted'}`}>2</span>
              <span className="text-[10px] font-bold uppercase tracking-widest hidden md:block">Envío</span>
            </div>
            <div className={`h-[2px] w-12 ${step >= 3 || preferenceId ? 'bg-primary' : 'bg-sand'}`} />
            <div className={`flex items-center gap-2 ${preferenceId ? 'text-primary' : 'text-muted'}`}>
              <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${preferenceId ? 'bg-primary text-cream' : 'bg-sand text-muted'}`}>3</span>
              <span className="text-[10px] font-bold uppercase tracking-widest hidden md:block">Pago</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-12">
            {/* FORMULARIO */}
            <div className="space-y-8">
              <form onSubmit={handleSubmit} className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-sand shadow-xl relative overflow-hidden">
                
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-cream/50 rounded-bl-full -mr-16 -mt-16 z-0" />

                <div className="relative z-10">
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700 font-medium mb-8">
                      ⚠️ {error}
                    </div>
                  )}

                  {step === 1 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                      <div className="flex items-center gap-3 border-b border-sand pb-4">
                        <User className="text-primary w-5 h-5" />
                        <h2 className="text-xl font-serif font-bold text-primary">¿Quién está comprando?</h2>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-muted ml-2">Nombre Completo</label>
                          <input
                            required
                            type="text"
                            placeholder="Ej. Juan Pérez"
                            className="w-full bg-cream/30 border border-sand rounded-2xl py-3 px-4 focus:ring-1 focus:ring-primary outline-none"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-muted ml-2">WhatsApp</label>
                          <input
                            required
                            type="tel"
                            placeholder="999 888 777"
                            className="w-full bg-cream/30 border border-sand rounded-2xl py-3 px-4 focus:ring-1 focus:ring-primary outline-none"
                            value={formData.buyer_phone}
                            onChange={(e) => setFormData({...formData, buyer_phone: e.target.value})}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-muted ml-2">Email</label>
                          <input
                            required
                            type="email"
                            placeholder="tu@email.com"
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
                            placeholder="Repite tu email"
                            className="w-full bg-cream/30 border border-sand rounded-2xl py-3 px-4 focus:ring-1 focus:ring-primary outline-none"
                            value={formData.emailConfirm}
                            onChange={(e) => setFormData({...formData, emailConfirm: e.target.value})}
                          />
                        </div>
                      </div>
                      
                      <button
                        type="submit"
                        className="w-full py-4 bg-primary text-cream rounded-full font-bold uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 group"
                      >
                        Siguiente: Datos de Envío
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  )}

                  {step === 2 && !preferenceId && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                      <div className="flex items-center justify-between border-b border-sand pb-4">
                        <div className="flex items-center gap-3">
                          <MapPin className="text-primary w-5 h-5" />
                          <h2 className="text-xl font-serif font-bold text-primary">¿A dónde lo enviamos?</h2>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => setStep(1)}
                          className="text-[10px] font-bold uppercase text-muted hover:text-primary flex items-center gap-1"
                        >
                          <ChevronLeft className="w-3 h-3" /> Atrás
                        </button>
                      </div>

                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted ml-2">Nombre del Destinatario</label>
                            <input
                              required
                              type="text"
                              placeholder="¿Quién recibe el paquete?"
                              className="w-full bg-cream/30 border border-sand rounded-2xl py-3 px-4 focus:ring-1 focus:ring-primary outline-none"
                              value={formData.shipping_name}
                              onChange={(e) => setFormData({...formData, shipping_name: e.target.value})}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted ml-2">Teléfono de contacto</label>
                            <input
                              required
                              type="tel"
                              placeholder="999 888 777"
                              className="w-full bg-cream/30 border border-sand rounded-2xl py-3 px-4 focus:ring-1 focus:ring-primary outline-none"
                              value={formData.shipping_phone}
                              onChange={(e) => setFormData({...formData, shipping_phone: e.target.value})}
                            />
                          </div>
                        </div>

                        <UbigeoSelector 
                          onSelect={handleUbigeoSelect}
                        />

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-muted ml-2">Dirección Exacta</label>
                          <input
                            required
                            type="text"
                            placeholder="Calle, Número, Dpto, Referencia"
                            className="w-full bg-cream/30 border border-sand rounded-2xl py-3 px-4 focus:ring-1 focus:ring-primary outline-none"
                            value={formData.shipping_address}
                            onChange={(e) => setFormData({...formData, shipping_address: e.target.value})}
                          />
                        </div>

                        {formData.shipping_ubigeo && sellersInfo.length > 0 && shippingFee === 0 && (
                          <div className="bg-green-50 border border-green-100 rounded-2xl p-4 flex items-center gap-3">
                            <div className="bg-green-500 rounded-full p-1">
                              <Truck className="text-white w-3 h-3" />
                            </div>
                            <p className="text-xs text-green-700 font-bold uppercase tracking-wider">¡Genial! Tu ubicación califica para Envío Gratis con este vendedor.</p>
                          </div>
                        )}
                      </div>
                      
                      <button
                        type="submit"
                        disabled={isProcessing}
                        className="w-full py-4 bg-primary text-cream rounded-full font-bold uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isProcessing ? 'Procesando...' : 'Ir al Pago Seguro'}
                        {!isProcessing && <ChevronRight className="w-4 h-4" />}
                      </button>
                    </div>
                  )}

                  {preferenceId && (
                    <div className="space-y-8 animate-in zoom-in duration-500">
                      <div className="text-center space-y-2">
                        <ShieldCheck className="text-green-500 w-12 h-12 mx-auto" />
                        <h2 className="text-2xl font-serif font-bold text-primary">Todo listo para pagar</h2>
                        <p className="text-sm text-muted">Haz clic abajo para completar tu compra de forma segura.</p>
                      </div>
                      
                      <Wallet 
                        initialization={{ preferenceId: preferenceId }}
                        customization={{ visual: { buttonBackground: 'black', borderRadius: '24px' } } as any} 
                      />

                      <button 
                        type="button" 
                        onClick={() => setPreferenceId(null)}
                        className="w-full text-[10px] font-bold uppercase text-muted hover:text-primary transition-all"
                      >
                        Cambiar datos de envío
                      </button>
                    </div>
                  )}
                </div>
              </form>

              {/* Bypass Dev */}
              {process.env.NEXT_PUBLIC_ALLOW_DEBUG_BYPASS === 'true' && !preferenceId && (
                <div className="flex justify-center">
                  <button onClick={handleBypassPurchase} className="text-[10px] text-muted hover:text-accent font-bold uppercase tracking-widest opacity-50 hover:opacity-100 transition-all">
                    🧪 Bypass para pruebas
                  </button>
                </div>
              )}
            </div>

            {/* RESUMEN LATERAL */}
            <aside className="space-y-6">
              <div className="bg-white rounded-[2.5rem] p-8 border border-sand shadow-xl sticky top-32">
                <h3 className="text-xs font-bold uppercase tracking-widest text-primary mb-6 border-b border-sand pb-4">Resumen</h3>
                
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Subtotal ({cart.length} prendas)</span>
                    <span className="font-bold">S/ {totalPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted">Costo de Envío</span>
                    <span className={`font-bold ${!formData.shipping_ubigeo ? 'text-primary italic text-[11px]' : (shippingFee === 0 ? 'text-green-600' : 'text-primary')}`}>
                      {!formData.shipping_ubigeo ? 'Por calcular' : (shippingFee === 0 ? 'GRATIS' : `S/ ${shippingFee.toLocaleString()}`)}
                    </span>
                  </div>
                  <div className="pt-4 border-t border-sand flex justify-between items-baseline">
                    <span className="text-xs font-bold text-primary uppercase tracking-widest">Total</span>
                    <div className="text-right">
                      <span className="text-3xl font-serif font-bold text-accent">S/ {finalTotal.toLocaleString()}</span>
                      {!formData.shipping_ubigeo && <p className="text-[9px] text-muted uppercase tracking-widest mt-1">+ envío</p>}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {cart.map(item => (
                    <div key={item.id} className="flex gap-4 group">
                      <div className="relative w-12 h-16 shrink-0">
                        <img src={item.imageUrl} className="w-full h-full rounded-xl object-cover border border-sand" alt={item.title} />
                      </div>
                      <div className="min-w-0 flex flex-col justify-center">
                        <p className="text-[11px] font-bold text-primary truncate leading-tight">{item.title}</p>
                        <p className="text-[10px] text-muted italic">S/ {item.price.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-6 border-t border-sand">
                   <div className="flex items-center gap-3 text-[10px] text-muted font-bold uppercase tracking-widest">
                     <ShieldCheck className="w-4 h-4 text-primary" />
                     Garantía Antigravity
                   </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </Container>
    </div>
  );
}
