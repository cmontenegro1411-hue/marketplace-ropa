import React from 'react';
import { Navbar } from "@/components/ui/Navbar";
import { Container } from "@/components/ui/Container";
import { ProductCard } from "@/components/ui/ProductCard";
import { supabase } from "@/lib/supabase";
import { auth } from "@/auth";
import { DeleteListingButton } from "@/components/product/DeleteListingButton";
import { EditListingLink } from "@/components/product/EditListingLink";
import Link from 'next/link';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ProfilePage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/login');
  }

  // Fetch real User Products from Supabase
  const { data: myProducts, error } = await supabase
    .from('products')
    .select('*')
    .eq('seller_id', session.user.id)
    .order('created_at', { ascending: false });

  if (error) console.error("Error fetching user products:", error);

  const userName = session.user.name || "Usuario";

  // Calcular estadísticas dinámicas reales
  const activeProducts = myProducts?.filter(p => !p.status || p.status === 'available') || [];
  const soldProducts = myProducts?.filter(p => p.status === 'sold') || [];
  const totalSalesValue = soldProducts.reduce((sum, p) => sum + (p.price || 0), 0);
  const totalActiveValue = activeProducts.reduce((sum, p) => sum + (p.price || 0), 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 0 }).format(amount);
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
          <div className="text-center md:text-left space-y-2">
            <h1 className="text-4xl font-serif font-bold text-primary">{userName}</h1>
            <p className="text-muted font-medium">Panel del Vendedor • <span className="text-secondary font-bold tracking-tighter uppercase text-xs">Vendedor Verificado</span></p>
            <div className="flex flex-wrap justify-center md:justify-start gap-3 pt-2">
              <Link href="/profile/edit" className="px-6 py-2 bg-primary text-cream rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-opacity-90 transition-all shadow-md">Editar Perfil</Link>
              <Link href="/profile/settings" className="px-6 py-2 border border-sand rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-cream transition-all">Configuración</Link>
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
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-2">Artículos Vendidos</p>
            <p className="text-4xl font-serif font-bold text-secondary">{soldProducts.length}</p>
          </div>
          <div className="bg-white p-8 rounded-3xl border border-sand shadow-sm text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-2">Total Ganado en Ventas</p>
            <p className="text-4xl font-serif font-bold text-accent">{formatCurrency(totalSalesValue)}</p>
          </div>
        </div>

        {/* Listings Section */}
        <div className="space-y-8">
          <div className="flex items-center gap-8 border-b border-sand text-sm font-bold uppercase tracking-widest">
            <button className="pb-4 border-b-2 border-primary text-primary">Mi Inventario ({myProducts?.length || 0})</button>
            <button className="pb-4 text-muted hover:text-primary transition-colors opacity-40 cursor-not-allowed">Vendido</button>
            <button className="pb-4 text-muted hover:text-primary transition-colors opacity-40 cursor-not-allowed">Borradores</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {myProducts?.map(product => (
              <div key={product.id} className="relative group">
                <ProductCard 
                  id={product.id}
                  title={product.title}
                  brand={product.brand}
                  price={product.price}
                  condition={product.condition}
                  size={product.size}
                  imageUrl={product.images?.[0]}
                  status={product.status}
                />
                {/* Actions Overlay */}
                <EditListingLink productId={product.id} />
                <DeleteListingButton productId={product.id} title={product.title} />
              </div>
            ))}
            
            {/* Action Card: Upload More */}
            <Link href="/dashboard/sell" className="aspect-[3/4] rounded-2xl border-2 border-dashed border-sand flex flex-col items-center justify-center p-6 text-center group cursor-pointer hover:border-primary/50 hover:bg-white transition-all">
              <div className="w-12 h-12 bg-cream rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
              </div>
              <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Vender otra prenda</p>
            </Link>
          </div>

          {(!myProducts || myProducts.length === 0) && (
            <div className="py-20 text-center bg-white/50 rounded-3xl border border-dashed border-sand">
               <p className="text-muted italic">Aún no has publicado ninguna prenda en tu closet.</p>
               <Link href="/dashboard/sell" className="text-primary font-bold underline mt-2 inline-block">¡Empieza ahora!</Link>
            </div>
          )}
        </div>
      </Container>
    </main>
  );
}
