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
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Error al registrarse');
      }

      // Registro exitoso, redirigir al login
      router.push('/login?registered=true');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <Container className="py-20 flex justify-center">
        <div className="w-full max-w-md">
          <div className="bg-white p-10 rounded-[2.5rem] editorial-shadow border border-sand/50">
            <div className="text-center mb-10">
              <h1 className="text-4xl font-serif font-bold text-primary mb-3">Únete a la Revolución</h1>
              <p className="text-muted font-medium italic">Comienza a vender en tu propio Closet de lujo.</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-secondary/10 border border-secondary/20 text-secondary text-xs font-bold rounded-xl text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
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
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted px-1">Email Editorial</label>
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
                <span className="relative z-10">{isLoading ? 'Creando Closet...' : 'Crear mi Cuenta'}</span>
                <div className="absolute inset-0 bg-accent translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-xs text-muted font-medium">
                ¿Ya tienes cuenta?{' '}
                <Link href="/login" className="text-primary font-bold hover:text-accent underline underline-offset-4 transition-colors">
                  Inicia Sesión
                </Link>
              </p>
            </div>
          </div>

          <div className="mt-10 text-center px-10">
            <p className="text-[10px] text-muted leading-relaxed">
              Al registrarte, aceptas convertirte en parte de una comunidad enfocada en la sustentabilidad y el consumo consciente.
            </p>
          </div>
        </div>
      </Container>
    </main>
  );
}
