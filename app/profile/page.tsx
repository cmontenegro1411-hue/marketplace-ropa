import React from 'react';
import { Navbar } from "@/components/ui/Navbar";
import { Container } from "@/components/ui/Container";
import { ProfileInventory } from "@/components/profile/ProfileInventory";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { auth } from "@/auth";
import { MPConnectButton } from "@/components/profile/MPConnectButton";
import { WalletHistory } from "@/components/profile/WalletHistory";
import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getOrCreateCredits } from '@/lib/credits';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function ProfilePage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/login');
  }

  // Fetch real User Products from Supabase
  const { data: myProducts, error: productsError } = await supabase
    .from('products')
    .select('*')
    .eq('seller_id', session.user.id)
    .order('created_at', { ascending: false });

  // Obtener BALANCES (Escrow centralizado)
  const { data: userData, error: userErr } = await supabaseAdmin
    .from('users')
    .select('balance_pending, balance_available')
    .eq('id', session.user.id)
    .single();

  if (userErr) {
    console.error("[Profile] Error fetching user balances:", userErr);
  }

  // En modelo centralizado todos están conectados a través de la cuenta maestra
  const isMPConnected = true;
  const balancePending = userData?.balance_pending || 0;
  const balanceAvailable = userData?.balance_available || 0;

  // Obtener mis compras (donde soy el comprador)
  /* const { data: myPurchases } = await supabase
    .from('products')
    .select('*')
    .eq('buyer_email', session.user.email)
    .order('created_at', { ascending: false }); */

  // Obtener historial de billetera
  const { data: walletTransactions } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (productsError) console.error("Error fetching user products:", productsError);

  const userName = session.user.name || "Usuario";
  const isAdmin = (session.user as any).role === 'admin';
  
  // Obtener información de créditos unificada
  const creditInfo = await getOrCreateCredits(session.user.id as string);

  // Calcular estadísticas dinámicas reales
  const activeProducts = myProducts?.filter(p => !p.status || p.status === 'available') || [];
  const reservedProducts = myProducts?.filter(p => p.status === 'reserved') || [];
  const soldProducts = myProducts?.filter(p => p.status === 'sold') || [];
  
  const totalSalesValue = soldProducts.reduce((sum, p) => sum + (p.price || 0), 0);
  const totalActiveValue = activeProducts.reduce((sum, p) => sum + (p.price || 0), 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(amount);
  };

  return (
    <main className="min-h-screen bg-cream pb-20">
      <Navbar />

      {/* Profile Header */}
      <section className="bg-white border-b border-sand py-16">
        <Container className="flex flex-col md:flex-row items-center gap-10">
          <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center text-4xl font-serif font-bold text-primary shadow-inner border border-sand">
            {userName.charAt(0)}
          </div>
          <div className="text-center md:text-left space-y-2 flex-1">
            <h1 className="text-4xl font-serif font-bold text-primary">{userName}</h1>
            <p className="text-muted font-medium">
              {(session.user as any).role === 'admin' ? 'Panel de Administrador' : 'Panel del Vendedor'} • 
              <span className="text-secondary font-bold tracking-tighter uppercase text-xs ml-1">
                {(session.user as any).role === 'admin' ? 'Fundador' : 'Vendedor Verificado'}
              </span>
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-3 pt-2">
              <Link href="/profile/edit" className="px-6 py-2 bg-primary text-cream rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-opacity-90 transition-all shadow-md">Editar Perfil</Link>
              <Link href="/profile/settings" className="px-6 py-2 border border-sand rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-cream transition-all">Configuración</Link>
              {((session.user as any).role === 'admin') && (
                 <Link href="/dashboard/ai-history" className="px-6 py-2 border border-sand bg-cream/50 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-sand transition-all">🔑 Admin: Auditoría IA</Link>
              )}
              <Link href="/dashboard/credits" className="px-6 py-2 border border-accent text-accent rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-accent/5 transition-all">Recargar Créditos IA</Link>
              
              <Suspense fallback={<div className="h-10 w-40 bg-sand/20 animate-pulse rounded-full"></div>}>
                <MPConnectButton isConnected={isMPConnected} />
              </Suspense>
            </div>
            
            <div className="flex flex-wrap justify-center md:justify-start gap-8 pt-6 border-t border-sand/50 mt-6">
              <div className="flex flex-col">
                <span className="text-[9px] font-bold uppercase tracking-widest text-muted">Billetera Disponible</span>
                <span className="font-bold text-xl text-accent">{formatCurrency(balanceAvailable)}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-bold uppercase tracking-widest text-muted">En Tránsito (Escrow)</span>
                <span className="font-bold text-xl text-secondary">{formatCurrency(balancePending)}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-bold uppercase tracking-widest text-muted">Créditos IA</span>
                <span className="font-bold text-xl text-primary">{isAdmin ? '∞' : creditInfo.credits_remaining}</span>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Statistics Section */}
      <Container className="py-12">
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <div className="bg-white p-8 rounded-3xl border border-sand shadow-sm text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-2">Publicaciones Activas</p>
            <p className="text-4xl font-serif font-bold text-primary">{activeProducts.length}</p>
            <p className="text-[10px] text-muted mt-2 font-medium">Inventario: {formatCurrency(totalActiveValue)}</p>
          </div>
          <div className="bg-white p-8 rounded-3xl border border-sand shadow-sm text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-2">Artículos Reservados</p>
            <p className="text-4xl font-serif font-bold text-secondary">{reservedProducts.length}</p>
          </div>
          <div className="bg-white p-8 rounded-3xl border border-sand shadow-sm text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-2" title="Suma del valor de tus prendas vendidas">Valor Circular Generado</p>
            <p className="text-4xl font-serif font-bold text-accent">{formatCurrency(totalSalesValue)}</p>
          </div>
        </div>

        {/* Listings Section (Client side Tabs) */}
        <ProfileInventory products={myProducts || []} />

        {/* Wallet History Section */}
        <div className="mt-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2" ry="2"/>
                <line x1="2" y1="10" x2="22" y2="10"/>
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-serif font-bold text-primary">Historial de Billetera</h2>
              <p className="text-xs text-muted font-medium">Seguimiento de tus ingresos y liberaciones</p>
            </div>
          </div>
          
          <WalletHistory transactions={walletTransactions || []} />
        </div>
      </Container>
    </main>
  );
}
