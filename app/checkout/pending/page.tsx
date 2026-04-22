'use client';

import React, { Suspense } from 'react';
import { Navbar } from '@/components/ui/Navbar';
import Link from 'next/link';

function PendingContent() {
  return (
    <div className="min-h-screen bg-[#FBF9F6] flex flex-col">
      <Navbar />
      <main className="flex-grow flex items-center justify-center p-6 py-20">
        <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl border border-sand max-w-2xl w-full text-center animate-fade-in-up">
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-8 shadow-lg ring-8 ring-amber-50">
             <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          
          <div className="space-y-4 mb-10">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-primary">Pago Pendiente</h1>
            <p className="text-muted text-lg leading-relaxed max-w-md mx-auto">
              Tu pago está siendo procesado por la entidad bancaria. Esto puede tomar unos minutos o hasta 24 horas dependiendo del método elegido.
            </p>
          </div>

          <div className="bg-amber-50/50 p-6 rounded-3xl mb-8 border border-amber-100 text-left space-y-3">
            <h3 className="text-sm font-bold text-amber-800 flex items-center gap-2">
              ¿Qué significa esto?
            </h3>
            <p className="text-xs text-amber-700/80 leading-relaxed">
              Si utilizaste un medio de pago en efectivo o transferencia bancaria, el sistema espera la confirmación de la pasarela. Te enviaremos un correo electrónico en cuanto el pago sea aprobado y tus prendas queden aseguradas.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/profile"
              className="px-8 py-4 bg-primary text-cream rounded-full text-xs font-bold uppercase tracking-widest hover:bg-primary/90 transition-all shadow-md flex items-center justify-center gap-2"
            >
              Ir a mi perfil
            </Link>
            <Link
              href="/search"
              className="px-8 py-4 bg-white text-primary border border-sand rounded-full text-xs font-bold uppercase tracking-widest hover:bg-sand/20 transition-all flex items-center justify-center gap-2"
            >
              Seguir explorando
            </Link>
          </div>
          
          <p className="mt-12 text-[10px] text-muted uppercase tracking-[0.2em]">
            Moda Circular · Tu compra está protegida
          </p>
        </div>
      </main>
    </div>
  );
}

export default function PendingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <p className="text-primary font-serif italic animate-pulse">Cargando...</p>
      </div>
    }>
      <PendingContent />
    </Suspense>
  );
}
