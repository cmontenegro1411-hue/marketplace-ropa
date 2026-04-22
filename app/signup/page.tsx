'use client';

import React, { useState } from 'react';
import { Container } from '@/components/ui/Container';
import { Navbar } from '@/components/ui/Navbar';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  // Obtener datos de MP de la URL (después del callback)
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const mp_user_id = searchParams?.get('mp_user_id');
  const mp_access_token = searchParams?.get('mp_access_token');
  const mp_public_key = searchParams?.get('mp_public_key');
  const isLinked = !!mp_user_id;

  const handleLinkMP = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/mercadopago/url');
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch (_err) {
      setError('Error al conectar con Mercado Pago');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLinked) {
      setError('Debes vincular tu cuenta de Mercado Pago primero.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          password, 
          name,
          mp_user_id,
          mp_access_token,
          mp_public_key
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Error al registrarse');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/login?registered=true');
      }, 3000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <Container className="py-20 flex justify-center">
          <div className="w-full max-w-md bg-white p-10 rounded-[2.5rem] editorial-shadow border border-sand/50 text-center">
             <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6 text-accent">
               <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
             </div>
             <h2 className="text-3xl font-serif font-bold text-primary mb-4">¡Registro Exitoso!</h2>
             <p className="text-muted font-medium mb-8">Tu cuenta ha sido creada y tienes <strong>2 créditos de IA</strong> de regalo para empezar.</p>
             <p className="text-xs text-muted">Redirigiendo al inicio de sesión...</p>
          </div>
        </Container>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <Container className="py-20 flex justify-center">
        <div className="w-full max-w-md">
          <div className="bg-white p-10 rounded-[2.5rem] editorial-shadow border border-sand/50">
            <div className="text-center mb-10">
              <h1 className="text-4xl font-serif font-bold text-primary mb-3">Únete a la Revolución</h1>
              <p className="text-muted font-medium italic">Vende tus prendas y recibe pagos seguros vía Mercado Pago.</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-secondary/10 border border-secondary/20 text-secondary text-xs font-bold rounded-xl text-center">
                {error}
              </div>
            )}

            {!isLinked ? (
              <div className="space-y-6">
                <div className="p-6 bg-accent/5 border border-accent/20 rounded-2xl text-center">
                  <p className="text-sm font-medium text-primary mb-4">Para ser vendedor, es indispensable vincular tu cuenta de Mercado Pago.</p>
                  <p className="text-[10px] text-muted mb-6 uppercase tracking-widest">¿No tienes cuenta? Se te pedirá crear una en el siguiente paso.</p>
                  <button 
                    onClick={handleLinkMP}
                    className="w-full py-4 bg-[#009EE3] text-white rounded-full text-[11px] font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:brightness-110 transition-all"
                  >
                    <svg width="20" height="20" viewBox="0 0 32 32" fill="none"><path d="M16 32c8.837 0 16-7.163 16-16S24.837 0 16 0 0 7.163 0 16s7.163 16 16 16z" fill="#009EE3"/><path d="M11 21.5l5.5-5.5 5.5 5.5V10.5L16.5 16l-5.5-5.5v11z" fill="#fff"/></svg>
                    Vincular con Mercado Pago
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-100 rounded-2xl mb-6">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-green-700 uppercase tracking-widest">Cuenta Vinculada</p>
                    <p className="text-xs text-green-600">Mercado Pago ID: {mp_user_id}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted px-1">Nombre Completo</label>
                  <input 
                    required
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-6 py-4 bg-background border border-sand rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all text-sm font-medium" 
                    placeholder="Tu nombre"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted px-1">Email de Acceso</label>
                  <input 
                    required
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-6 py-4 bg-background border border-sand rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all text-sm font-medium" 
                    placeholder="tu@email.com"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted px-1">Contraseña Segura</label>
                  <input 
                    required
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-6 py-4 bg-background border border-sand rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all text-sm font-medium" 
                    placeholder="••••••••"
                  />
                </div>

                <button 
                  disabled={isLoading}
                  type="submit"
                  className="w-full py-5 bg-primary text-cream rounded-full text-[11px] font-bold uppercase tracking-[0.3em] overflow-hidden relative group"
                >
                  <span className="relative z-10">{isLoading ? 'Procesando...' : 'Completar Registro'}</span>
                  <div className="absolute inset-0 bg-accent translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                </button>
              </form>
            )}

            <div className="mt-8 text-center">
              <p className="text-xs text-muted font-medium">
                ¿Ya tienes cuenta?{' '}
                <Link href="/login" className="text-primary font-bold hover:text-accent underline underline-offset-4 transition-colors">
                  Inicia Sesión
                </Link>
              </p>
            </div>
          </div>
        </div>
      </Container>
    </main>
  );
}
