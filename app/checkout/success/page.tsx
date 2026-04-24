'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/ui/Navbar';
import Link from 'next/link';

function SuccessContent() {
  const searchParams = useSearchParams();
  const paymentId = searchParams.get('payment_id') || searchParams.get('collection_id');
  const _status = searchParams.get('status') || searchParams.get('collection_status');

  return (
    <div className="min-h-screen bg-[#FBF9F6] flex flex-col">
      <Navbar />
      <main className="flex-grow flex items-center justify-center p-6 py-20">
        <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl border border-sand max-w-2xl w-full text-center animate-fade-in-up">
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-[#4A5D4E] text-cream flex items-center justify-center mx-auto mb-8 shadow-lg ring-8 ring-[#4A5D4E]/10">
             <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          
          <div className="space-y-4 mb-10">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-primary">¡Pago Confirmado!</h1>
            <p className="text-muted text-lg leading-relaxed max-w-md mx-auto">
              Tu transacción ha sido procesada con éxito y tus prendas ya están aseguradas.
            </p>
          </div>

          <div className="bg-[#F9F7F2] p-6 rounded-3xl mb-8 border border-sand/50 text-left space-y-4">
            <div className="flex justify-between items-center border-b border-sand pb-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted">ID de Pago</span>
              <span className="text-sm font-mono font-bold text-primary">{paymentId || 'N/A'}</span>
            </div>
            
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-primary flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
                Estado: Fondos en Fideicomiso (Escrow)
              </h3>
              <p className="text-xs text-muted leading-relaxed">
                Tu dinero está protegido por <strong>Moda Circular</strong>. Solo se liberará al vendedor una vez que confirmes la recepción de tus prendas a través del correo que te enviamos.
              </p>
            </div>
          </div>

          <div className="flex justify-center">
            <Link
              href="/search"
              className="px-10 py-4 bg-primary text-cream rounded-full text-xs font-bold uppercase tracking-widest hover:bg-primary/90 transition-all shadow-md flex items-center justify-center gap-2"
            >
              Volver al catálogo
            </Link>
          </div>
          
          <p className="mt-12 text-[10px] text-muted uppercase tracking-[0.2em]">
            Gracias por elegir un consumo responsable
          </p>
        </div>
      </main>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-primary/10 border-t-primary rounded-full animate-spin"></div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
