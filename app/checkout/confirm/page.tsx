import { supabaseAdmin } from "@/lib/supabase-admin";
import { ConformityForm } from "./ConformityForm";
import Link from 'next/link';
import { Navbar } from '@/components/ui/Navbar';
import { Container } from '@/components/ui/Container';

export const dynamic = 'force-dynamic';

interface ConfirmPageProps {
  searchParams: Promise<{ t?: string; p?: string }>;
}

export default async function ConfirmConformityPage({ searchParams }: ConfirmPageProps) {
  const params = await searchParams;
  const token = params.t;
  const productId = params.p;

  if (!token || !productId) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-6 text-center">
        <div className="bg-white p-12 rounded-[3rem] shadow-xl max-w-md">
          <h1 className="text-3xl font-serif font-bold text-primary mb-4">Enlace Inválido</h1>
          <p className="text-muted mb-8">El enlace de confirmación parece estar incompleto o es incorrecto.</p>
          <Link href="/" className="px-8 py-3 bg-primary text-cream rounded-full font-bold uppercase text-xs tracking-widest">Volver al Inicio</Link>
        </div>
      </div>
    );
  }

  // Validar producto y token
  const { data: product } = await supabaseAdmin
    .from('products')
    .select('*, users!inner(name)')
    .eq('id', productId)
    .eq('conformity_token', token)
    .single();

  if (!product) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-6 text-center">
        <div className="bg-white p-12 rounded-[3rem] shadow-xl max-w-md">
          <h1 className="text-3xl font-serif font-bold text-primary mb-4">Pedido no encontrado</h1>
          <p className="text-muted mb-8">No pudimos encontrar la prenda asociada a este enlace o ya ha sido confirmada.</p>
          <Link href="/" className="px-8 py-3 bg-primary text-cream rounded-full font-bold uppercase text-xs tracking-widest">Ir a la tienda</Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-cream pb-20">
      <Navbar />
      <Container className="pt-20 max-w-2xl">
        <div className="bg-white p-10 md:p-16 rounded-[3rem] shadow-2xl editorial-shadow border border-sand/30 text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-8 bg-[#00E0A6]/10">
             <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#008F6A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
          </div>

          <h1 className="text-4xl font-serif font-bold text-primary mb-4">Confirmar Recepción</h1>
          <p className="text-muted italic mb-10 text-lg">¿Has recibido tu prenda y estás conforme con ella?</p>

          <div className="bg-cream/30 p-8 rounded-3xl border border-sand mb-10 flex flex-col md:flex-row items-center gap-6 text-left">
            <img src={product.images?.[0] || '/placeholder.png'} alt={product.title} className="w-24 h-32 object-cover rounded-2xl shadow-md" />
            <div>
               <p className="text-xs font-bold uppercase tracking-widest text-muted mb-1">{product.brand}</p>
               <h3 className="text-xl font-serif font-bold text-primary mb-2">{product.title}</h3>
               <p className="text-sm text-primary/70">Vendido por <span className="font-bold text-primary">{product.users?.name}</span></p>
               <p className="text-lg font-bold text-accent mt-2">S/ {product.price}</p>
            </div>
          </div>

          <ConformityForm productId={productId} token={token} />

          <p className="mt-8 text-[11px] text-muted leading-relaxed max-w-sm mx-auto">
             Al confirmar, autorizas que el pago sea liberado al vendedor. 
             Esta acción no se puede deshacer.
          </p>
        </div>
      </Container>
    </main>
  );
}
