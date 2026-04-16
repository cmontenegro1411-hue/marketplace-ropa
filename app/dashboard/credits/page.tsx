'use client';

import React, { useState } from 'react';
import { Container } from "@/components/ui/Container";

const PACKAGES = [
  { id: 'pkg_5', title: '5 Créditos IA', desc: 'Ideal para probar la herramienta de autogenerado con Visión.', price: 9.90, popular: false },
  { id: 'pkg_15', title: '15 Créditos IA', desc: 'Mejor valor. Sube un armario de tamaño moderado rápìdo.', price: 24.90, popular: true },
  { id: 'pkg_50', title: '50 Créditos IA', desc: 'Para vendedores profesionales y boutiques grandes.', price: 69.90, popular: false }
];

export default function CreditsPage() {
  const [loadingPkg, setLoadingPkg] = useState<string | null>(null);

  const handleBuy = async (pkg: typeof PACKAGES[0]) => {
    setLoadingPkg(pkg.id);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: pkg.id,
          title: pkg.title,
          unit_price: pkg.price,
          quantity: 1
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);

      if (data.init_point) {
        window.location.href = data.init_point; // Redirect to Mercado Pago
      } else {
        throw new Error('No checkout URL returned.');
      }
    } catch (e: any) {
      alert(`Error al procesar: ${e.message}`);
    } finally {
      setLoadingPkg(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF9F6] pt-32 pb-24">
      <Container>
        <div className="max-w-2xl mx-auto text-center mb-16">
          <div className="inline-block px-4 py-1.5 border border-accent/20 rounded-full mb-6 bg-white animate-fade-in-up">
             <span className="text-secondary font-bold tracking-[0.5em] uppercase text-[9px]">Automatización Premium</span>
          </div>
          <h1 className="text-5xl font-serif font-bold text-primary tracking-tight mb-4">Recarga tus Créditos IA</h1>
          <p className="text-muted text-lg max-w-lg mx-auto">
            Optimiza tu tiempo y escala tus ventas. Nuestra Inteligencia Artificial analiza tus prendas, extrae atributos, sugiere precios competitivos y redacta descripciones irresistibles en segundos.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {PACKAGES.map((pkg) => (
            <div key={pkg.id} className={`relative bg-white rounded-[2rem] p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl flex flex-col ${pkg.popular ? 'border-2 border-accent shadow-xl scale-105 z-10' : 'border border-sand hover:border-accent hover:shadow-xl shadow-sm'}`}>
              
              {pkg.popular && (
                <div className="absolute -top-4 inset-x-0 flex justify-center">
                  <span className="bg-accent text-white text-[9px] font-bold uppercase tracking-widest px-4 py-1 rounded-full shadow-md">
                    Más Popular
                  </span>
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-2xl font-serif font-bold text-primary mb-2 flex items-center justify-between">
                  {pkg.title}
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent/40"><path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/></svg>
                </h3>
                <p className="text-muted text-sm leading-relaxed">{pkg.desc}</p>
              </div>

              <div className="mt-auto mb-8">
                <div className="flex items-end gap-1">
                  <span className="text-base text-muted font-medium mb-1">S/</span>
                  <span className="text-5xl font-bold font-serif text-secondary">{pkg.price.toFixed(2)}</span>
                </div>
              </div>

              <button 
                onClick={() => handleBuy(pkg)}
                disabled={loadingPkg === pkg.id}
                className={`w-full py-4 rounded-full font-bold text-[10px] uppercase tracking-widest transition-all
                  ${pkg.popular 
                    ? 'bg-primary text-cream hover:bg-secondary shadow-lg' 
                    : 'bg-primary/5 text-primary border border-transparent hover:bg-primary hover:text-cream shadow-sm'}
                  disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loadingPkg === pkg.id ? 'Generando...' : 'Comprar Créditos'}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-20 flex flex-col items-center justify-center gap-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Pago 100% Seguro Vía Mercado Pago</p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
            <img src="https://cdn.icon-icons.com/icons2/2699/PNG/512/mercadopago_logo_icon_168262.png" alt="Mercado Pago" className="h-6 object-contain" />
            <img src="https://seeklogo.com/images/Y/yape-logo-3E473EE7E5-seeklogo.com.png" alt="Yape" className="h-8 object-contain" />
            <img src="https://plazavea.vteximg.com.br/arquivos/Plin-Logo-300x126.png" alt="Plin" className="h-[22px] object-contain" />
            <img src="https://cdn.icon-icons.com/icons2/2699/PNG/512/visa_logo_icon_168128.png" alt="Visa" className="h-4 object-contain opacity-80" />
            <img src="https://cdn.icon-icons.com/icons2/2699/PNG/512/mastercard_logo_icon_168102.png" alt="Mastercard" className="h-5 object-contain opacity-80" />
          </div>
        </div>
      </Container>
    </div>
  );
}
