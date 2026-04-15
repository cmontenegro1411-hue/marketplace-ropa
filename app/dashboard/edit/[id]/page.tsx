import React from 'react';
import { Container } from \"@/components/ui/Container\";
import { supabase } from \"@/lib/supabase\";
import { auth } from \"@/auth\";
import { redirect, notFound } from 'next/navigation';
import { EditProductForm } from \"@/components/product/EditProductForm\";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();
  
  if (!session?.user) {
    redirect('/login');
  }

  // 1. Fetch Product
  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !product) {
    notFound();
  }

  // 2. Verify Ownership
  if (product.seller_id !== session.user.id) {
    redirect('/profile');
  }

  return (
    <main className="py-16">
      <Container className="max-w-3xl">
        <div className="mb-10 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-serif font-bold text-primary mb-2">Editar Prenda</h1>
            <p className="text-muted">Actualiza los detalles de tu publicación en tiempo real.</p>
          </div>
          <div className="hidden md:block">
             <span className="px-4 py-2 bg-cream border border-sand rounded-full text-[10px] font-bold uppercase tracking-widest text-primary">ID: {id.slice(0,8).toUpperCase()}</span>
          </div>
        </div>

        <EditProductForm product={product} />
      </Container>
    </main>
  );
}
