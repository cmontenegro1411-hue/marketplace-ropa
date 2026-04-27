import { Navbar } from "@/components/ui/Navbar";
import { Container } from "@/components/ui/Container";
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import Link from 'next/link';
import { supabase } from "@/lib/supabase";
import { ProductCard } from "@/components/ui/ProductCard";



export default async function Home() {
  async function getLatestProducts() {
    try {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('status', 'available')
        .order('created_at', { ascending: false })
        .limit(4);
      return data || [];
    } catch (_e) {
      return [];
    }
  }

  const latestProducts = await getLatestProducts();

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      
      <main>
        {/* HERO SECTION - EDITORIAL */}
        <section className="relative h-[90vh] flex items-center overflow-hidden bg-[#FBF9F6]">
          {/* Subtle Decorative Gradient */}
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-sand/20 to-transparent pointer-events-none" />
          
          <Container className="z-10 relative">
            <div className="max-w-4xl">
              <div className="inline-block px-4 py-1.5 border border-accent/30 rounded-full mb-8 animate-in fade-in slide-in-from-top-4 duration-1000">
                <span className="text-secondary font-bold tracking-[0.5em] uppercase text-[9px]">Sustainable • Editorial • Luxury</span>
              </div>
              
              <h1 className="text-7xl md:text-[11rem] font-serif font-bold text-primary leading-[0.85] tracking-tighter mb-10 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
                Reinventa <br />
                <span className="italic font-light text-accent">tu Estilo</span>
              </h1>
              
              <div className="flex flex-col md:flex-row items-end gap-12 animate-in fade-in duration-1000 delay-500">
                <p className="text-lg text-muted font-medium max-w-sm leading-relaxed mb-4">
                  Una plataforma curada donde el lujo pre-amado encuentra una nueva vida. Calidad sin compromisos.
                </p>
                <Link href="/search">
                  <button className="group relative px-12 py-5 bg-primary text-cream rounded-full overflow-hidden transition-all duration-500 hover:shadow-2xl hover:scale-105 active:scale-95">
                    <span className="relative z-10 text-[11px] font-bold uppercase tracking-[0.3em]">Explorar Catálogo</span>
                    <div className="absolute inset-0 bg-accent translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
                  </button>
                </Link>
              </div>
            </div>
          </Container>
          
          {/* Floating Luxury Tag */}
          <div className="absolute right-12 bottom-12 hidden lg:block animate-subtle-float">
             <div className="flex flex-col items-center">
                <div className="h-24 w-px bg-sand mb-4"></div>
                <span className="text-[10px] font-bold uppercase tracking-[0.5em] rotate-90 origin-left text-muted">Est. 2024</span>
             </div>
          </div>
        </section>

        {/* SECCIÓN RECIÉN LLEGADOS - PROTAGONISTA */}
        <section className="py-32 bg-white">
          <Container>
            <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
              <div className="space-y-4 max-w-xl">
                <div className="h-1 w-20 bg-accent"></div>
                <h2 className="text-5xl font-serif font-bold text-primary tracking-tight">Recién Llegados</h2>
                <p className="text-base text-muted font-medium leading-relaxed italic">Cada pieza es seleccionada mano a mano para asegurar los más altos estándares de autenticidad y condición.</p>
              </div>
              <Link href="/search" className="group flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.3em] text-primary hover:text-accent transition-colors">
                Ver Colección Completa 
                <div className="w-12 h-px bg-primary group-hover:bg-accent group-hover:w-16 transition-all"></div>
              </Link>
            </div>

            {latestProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-20">
                {latestProducts.map((p) => (
                  <ProductCard 
                    key={p.id}
                    id={p.id}
                    title={p.title}
                    brand={p.brand}
                    price={p.price}
                    condition={p.condition}
                    size={p.size}
                    imageUrl={p.images?.[0] || '/placeholder-product.png'}
                    status={p.status}
                  />
                ))}
              </div>
            ) : (
              <div className="py-32 text-center bg-background rounded-[4rem] border border-sand/50 shadow-inner">
                <p className="text-muted italic mb-6">Estamos preparando las próximas novedades editoriales.</p>
                <Link href="/dashboard/sell" className="text-accent font-bold uppercase text-[10px] tracking-widest hover:underline px-8 py-3 bg-white border border-sand rounded-full">Publicar en tu Closet</Link>
              </div>
            )}
          </Container>
        </section>

        {/* CATEGORÍAS RÁPIDAS - CURADAS */}
        <section className="py-32 bg-cream/40 overflow-hidden">
          <Container>
            <div className="text-center mb-20">
               <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-muted mb-4">Curaduría por Estilo</h3>
               <h2 className="text-5xl font-serif font-bold text-primary">Nuestras Categorías</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {[
                { name: 'Mujer', desc: 'Elegancia y Sofisticación', img: '/categories/mujer.png' },
                { name: 'Hombre', desc: 'Clásicos Atemporales', img: '/categories/hombre.png' },
                { name: 'Niños', desc: 'Pequeñas Tendencias', img: '/categories/ninos.png' },
                { name: 'Accesorios', desc: 'Detalles de Distinción', img: '/categories/accesorios.png' },
                { name: 'Calzado', desc: 'Pasos con Tradición', img: '/categories/calzado.png' }
              ].map((cat) => (
                <Link key={cat.name} href={`/search?cat=${cat.name}`} className="group relative aspect-[4/5] overflow-hidden rounded-[2.5rem] bg-white border border-sand shadow-sm hover:shadow-2xl transition-all duration-700 hover:-translate-y-2">
                  <img src={cat.img} alt={`Categoría ${cat.name}`} className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                  <div className="absolute inset-x-0 bottom-0 p-8 z-20 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white mb-2 opacity-0 group-hover:opacity-100 transition-opacity">{cat.desc}</p>
                    <h4 className="text-2xl lg:text-3xl font-serif font-bold text-white drop-shadow-md">{cat.name}</h4>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
                  <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/20 transition-colors duration-700 z-10" />
                </Link>
              ))}
            </div>
          </Container>
        </section>
      </main>

      <footer className="bg-primary pt-24 pb-12 text-cream/40">
        <Container>
          <div className="flex flex-col md:flex-row justify-between items-start border-b border-white/5 pb-16 mb-12">
            <div className="space-y-6 max-w-sm mb-12 md:mb-0">
              <h2 className="text-3xl font-serif font-bold text-cream">ModaCircular</h2>
              <p className="text-sm font-light leading-relaxed">
                Transformando el consumo a través de la elegancia y la responsabilidad. Cada prenda cuenta una historia de sustentabilidad.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-16">
              <div className="space-y-6">
                <h5 className="text-cream text-[10px] font-bold uppercase tracking-[0.2em]">Shop</h5>
                <ul className="space-y-3 text-sm flex flex-col">
                  <Link href="/search" className="hover:text-cream transition-colors">Novedades</Link>
                  <Link href="/search?cat=Mujer" className="hover:text-cream transition-colors">Mujer</Link>
                  <Link href="/search?cat=Hombre" className="hover:text-cream transition-colors">Hombre</Link>
                </ul>
              </div>
              <div className="space-y-6">
                <h5 className="text-cream text-[10px] font-bold uppercase tracking-[0.2em]">Más</h5>
                <ul className="space-y-3 text-sm flex flex-col">
                  <Link href="/dashboard/sell" className="hover:text-cream transition-colors">Vender</Link>
                  <Link href="/profile" className="hover:text-cream transition-colors">Mi Closet</Link>
                  <Link href="/sustentabilidad" className="hover:text-cream transition-colors">Filosofía</Link>
                </ul>
              </div>
            </div>
          </div>
          <div className="text-center text-[10px] font-bold uppercase tracking-widest">
            &copy; 2024 ModaCircular &mdash; All Rights Reserved
          </div>
        </Container>
      </footer>
    </div>
  );
}
