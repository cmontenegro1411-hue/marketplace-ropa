'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Container } from "@/components/ui/Container";
import { Navbar } from "@/components/ui/Navbar";
import { Button } from "@/components/ui/Button";
import Link from 'next/link';
import { updateProfile } from "@/app/actions/user-actions";
import { useRouter } from 'next/navigation';

export default function EditProfilePage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

  useEffect(() => {
    if (session?.user) {
      setFormData({
        name: session.user.name || '',
        email: session.user.email || '',
      });
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const result = await updateProfile(formData);

    if (result.success) {
      setMessage({ type: 'success', text: '¡Perfil actualizado exitosamente!' });
      // Update NextAuth session state
      await update({ name: formData.name, email: formData.email });
      setTimeout(() => {
        router.push('/profile');
      }, 1500);
    } else {
      setMessage({ type: 'error', text: result.error || 'Hubo un error al actualizar el perfil.' });
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-sand/30">
      <Navbar />
      
      <Container className="py-12 max-w-2xl">
        <header className="mb-10">
          <Link href="/profile" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted hover:text-primary transition-colors mb-6 group">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:-translate-x-1"><path d="m15 18-6-6 6-6"/></svg>
            Volver a Mi Closet
          </Link>
          <h1 className="text-4xl font-serif font-bold text-primary mb-2">Editar Perfil</h1>
          <p className="text-muted italic">Actualiza tu información personal para conectar mejor con otros miembros.</p>
        </header>

        <div className="bg-white rounded-[2rem] p-8 md:p-12 shadow-xl border border-sand">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {message && (
              <div className={`p-4 rounded-xl text-sm font-bold ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {message.text}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted">Nombre Completo</label>
              <input 
                required 
                type="text" 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                className="w-full bg-cream/30 border border-sand rounded-2xl px-5 py-4 text-sm focus:border-primary outline-none" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted">Correo Electrónico</label>
              <input 
                required 
                type="email" 
                value={formData.email} 
                onChange={(e) => setFormData({...formData, email: e.target.value})} 
                className="w-full bg-cream/30 border border-sand rounded-2xl px-5 py-4 text-sm focus:border-primary outline-none" 
              />
              <p className="text-[9px] text-muted uppercase tracking-widest mt-1 ml-2">* Este correo se usa para notificaciones e inicio de sesión.</p>
            </div>

            <div className="pt-6">
              <Button 
                type="submit" 
                fullWidth 
                size="lg" 
                disabled={isSubmitting || !formData.name || !formData.email}
              >
                {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </form>
        </div>
      </Container>
    </div>
  );
}
