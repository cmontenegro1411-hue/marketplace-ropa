'use client';

import React, { useEffect, useState } from 'react';
import { Container } from "@/components/ui/Container";
import Link from 'next/link';

export default function SuccessPage() {
  const [credits, setCredits] = useState<string>('');

  useEffect(() => {
    // Basic extraction from URL params (just for display)
    const params = new URLSearchParams(window.location.search);
    setCredits(params.get('credits') || 'X');
  }, []);

  return (
    <div className="min-h-screen bg-[#FBF9F6] flex flex-col items-center justify-center p-4">
      <Container className="max-w-md text-center">
        <div className="w-24 h-24 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        </div>
        
        <h1 className="text-4xl font-serif font-bold text-primary mb-4">¡Pago Exitoso!</h1>
        <p className="text-muted text-lg mb-10">
          Acabamos de recargar <strong className="text-secondary">{credits} Créditos de IA</strong> a tu cuenta exitosamente.
        </p>

        <div className="space-y-4 flex flex-col">
          <Link href="/dashboard/sell" className="w-full py-4 bg-primary text-cream rounded-full font-bold text-[10px] uppercase tracking-widest text-center hover:bg-secondary transition-all shadow-md">
            Ir a Publicar Prenda con IA
          </Link>
          <Link href="/profile" className="w-full py-4 text-muted rounded-full font-bold text-[10px] uppercase tracking-widest text-center hover:bg-sand/30 border border-transparent hover:border-sand transition-all">
            Volver a Mi Closet
          </Link>
        </div>
      </Container>
    </div>
  );
}
