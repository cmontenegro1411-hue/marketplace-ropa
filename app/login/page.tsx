'use client';

import React, { useState, Suspense } from 'react';
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { signIn } from "next-auth/react";

import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const isRegistered = searchParams.get('registered') === 'true';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Credenciales incorrectas. Verifica tu correo y contraseña.');
      } else {
        router.push('/search');
      }
    } catch (err) {
      setError('Ocurrió un error al intentar iniciar sesión.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-12">
      <div className="space-y-4">
        <Link href="/" className="inline-block text-2xl font-serif font-bold text-primary tracking-tighter mb-8">ModaCircular</Link>
        <h1 className="text-4xl font-serif font-bold text-primary">Inicia Sesión</h1>
        <p className="text-muted font-medium italic">Accede a tu closet personal y curaduría exclusiva.</p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        {isRegistered && (
          <div className="bg-accent/10 border border-accent/20 text-accent text-[11px] font-bold p-4 rounded-xl text-center uppercase tracking-widest animate-in zoom-in duration-500">
            ¡Registro exitoso! Ya puedes ingresar.
          </div>
        )}
        
        {error && (
          <div className="bg-secondary/10 border border-secondary/20 text-secondary text-xs p-4 rounded-xl font-bold text-center">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted px-1">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="tu@email.com"
              className="w-full bg-white border border-sand rounded-2xl px-6 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all font-medium" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted px-1">Contraseña</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full bg-white border border-sand rounded-2xl px-6 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all font-medium" 
            />
          </div>
        </div>

        <button 
          disabled={isLoading}
          className="w-full py-5 bg-primary text-cream rounded-full text-[11px] font-bold uppercase tracking-[0.3em] overflow-hidden relative group"
        >
          <span className="relative z-10">{isLoading ? 'Validando...' : 'Entrar al Closet'}</span>
          <div className="absolute inset-0 bg-accent translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
        </button>
      </form>

      <div className="relative py-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-sand"></div>
        </div>
        <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
          <span className="bg-background px-4 text-muted">O continuar con</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button className="flex items-center justify-center gap-3 py-4 border border-sand rounded-2xl hover:bg-white transition-all hover:shadow-lg font-bold text-[10px] uppercase tracking-widest">
          Google
        </button>
        <button className="flex items-center justify-center gap-3 py-4 border border-sand rounded-2xl hover:bg-white transition-all hover:shadow-lg font-bold text-[10px] uppercase tracking-widest">
          Apple
        </button>
      </div>

      <p className="text-center text-sm text-muted font-medium">
        ¿Aún no tienes cuenta? <Link href="/signup" className="font-bold text-primary hover:text-accent underline underline-offset-4 transition-colors">Regístrate gratis y vende</Link>
      </p>
    </div>
  );
};

const LoginPage = () => {
  return (
    <main className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Visual Side with Premium Vibe */}
      <div className="hidden lg:flex relative bg-primary items-center justify-center p-20 overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070" 
          className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay"
          alt="Luxury fashion background"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/80 to-accent/20" />
        
        <div className="relative z-10 text-left space-y-8 max-w-lg">
          <div className="h-1.5 w-24 bg-accent mb-12"></div>
          <h2 className="text-6xl font-serif font-light text-cream leading-[1.1]">
            El lujo <br />
            <span className="italic">re-imaginado</span>
          </h2>
          <p className="text-cream/60 font-bold tracking-[0.4em] uppercase text-[10px]">
            Moda Circular Marketplace • 2024
          </p>
        </div>
      </div>

      {/* Login Form Side */}
      <div className="flex items-center justify-center p-8 sm:p-12 lg:p-24">
        <Suspense fallback={<div className="w-full text-center text-sm font-bold animate-pulse text-muted">Cargando tu closet...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
};

export default LoginPage;
