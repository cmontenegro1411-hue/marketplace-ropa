'use client';

import React, { Suspense } from 'react';
import { Navbar } from '@/components/ui/Navbar';
import Link from 'next/link';

function ErrorContent() {
  return (
    <div className="min-h-screen bg-[#FBF9F6] flex flex-col">
      <Navbar />
      <main className="flex-grow flex items-center justify-center p-6 py-20">
        <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl border border-sand max-w-2xl w-full text-center animate-fade-in-up">
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-8 shadow-lg ring-8 ring-red-50">
             <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          </div>
          
          <div className="space-y-4 mb-10">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-primary">Algo no salió bien</h1>
            <p className="text-muted text-lg leading-relaxed max-w-md mx-auto">
              No pudimos procesar tu pago en este momento. No se ha realizado ningún cargo a tu cuenta.
            </p>
          </div>

          <div className="bg-red-50/50 p-6 rounded-3xl mb-8 border border-red-100 text-left space-y-3">
            <h3 className="text-sm font-bold text-red-800 flex items-center gap-2">
              Posibles causas:
            </h3>
            <ul className="text-xs text-red-700/80 space-y-2 list-disc pl-4">
              <li>Fondos insuficientes en la tarjeta seleccionada.</li>
              <li>La transacción fue rechazada por tu entidad bancaria.</li>
              <li>Hubo un problema de conexión con la pasarela de pagos.</li>
              <li>Se canceló el proceso manualmente.</li>
            </ul>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/checkout"
              className="px-8 py-4 bg-primary text-cream rounded-full text-xs font-bold uppercase tracking-widest hover:bg-primary/90 transition-all shadow-md flex items-center justify-center gap-2"
            >
              Reintentar pago
            </Link>
            <Link
              href="/cart"
              className="px-8 py-4 bg-white text-primary border border-sand rounded-full text-xs font-bold uppercase tracking-widest hover:bg-sand/20 transition-all flex items-center justify-center gap-2"
            >
              Volver al carrito
            </Link>
          </div>
          
          <p className="mt-12 text-[10px] text-muted uppercase tracking-[0.2em]">
            Si el problema persiste, por favor contáctanos
          </p>
        </div>
      </main>
    </div>
  );
}

export default function ErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <p className="text-primary font-serif italic animate-pulse">Cargando...</p>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  );
}
