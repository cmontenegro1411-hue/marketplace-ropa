import { supabase } from "@/lib/supabase";
import { Container } from "@/components/ui/Container";
import { Navbar } from "@/components/ui/Navbar";
import { ProductCard } from "@/components/ui/ProductCard";
import { FilterSidebar } from "@/components/product/FilterSidebar";
import React, { Suspense } from 'react';

export const dynamic = 'force-dynamic';

export default async function SearchPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ [key: string]: string | string[] | undefined }> 
}) {
  const resolvedParams = await searchParams;
  const category = resolvedParams.cat as string;
  const type = resolvedParams.type as string; // Nuevo: Tipo de producto (Ropa, Calzado, etc)
  const condition = resolvedParams.cond as string;
  const query = resolvedParams.q as string;

  // 1. Detección de columnas para evitar fallos catastróficos
  const { data: sample } = await supabase.from('products').select('*').limit(1);
  const columns = sample && sample.length > 0 ? Object.keys(sample[0]) : [];
  
  const hasCategorySingular = columns.includes('category');
  const hasCategoriesPlural = columns.includes('categories');
  const hasBrand = columns.includes('brand');
  const hasDescription = columns.includes('description');

  // 2. Construcción de Query Segura
  let dbQuery = supabase.from('products').select('*');

  // Filtros dinámicos de Segmento (Mujer, Hombre, Niños)
  if (category) {
    if (hasCategorySingular) {
      // Si se busca un segmento específico, incluimos también Unisex para mayor visibilidad
      if (category !== 'Unisex') {
        dbQuery = dbQuery.or(`category.ilike.%${category}%,category.ilike.%Unisex%`);
      } else {
        dbQuery = dbQuery.ilike('category', `%${category}%`);
      }
    } else if (hasCategoriesPlural) {
      dbQuery = dbQuery.contains('categories', [category]);
    }
  }

  // Filtro de Tipo de Producto (Ropa, Calzado, Accesorios)
  if (type) {
    if (hasCategorySingular) {
      dbQuery = dbQuery.ilike('category', `%${type}%`);
    }
  }

  // Filtro de Condición
  if (condition && columns.includes('condition')) {
    dbQuery = dbQuery.eq('condition', condition);
  }

  // BÚSQUEDA MULTICANAL (Título, Marca, Descripción)
  if (query) {
    const searchTerm = `%${query}%`;
    let orFilters = `title.ilike.${searchTerm}`;
    
    if (hasBrand) {
      orFilters += `,brand.ilike.${searchTerm}`;
    }
    if (hasDescription) {
      orFilters += `,description.ilike.${searchTerm}`;
    }
    
    dbQuery = dbQuery.or(orFilters);
  }

  // Idealmente, se colocaría en primer lugar lo más reciente, pero podrías ordenar los 'available' primero si construyes una View.
  const { data: products, error } = await dbQuery.order('created_at', { ascending: false });

  if (error) {
    console.error("Error en búsqueda:", error.message);
  }

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      
      <Container className="py-12">
        <header className="mb-12 border-b border-sand pb-10">
          <h1 className="text-4xl lg:text-5xl font-serif font-bold text-primary mb-2 tracking-tight">Catálogo Curado</h1>
          {query && (
            <p className="text-secondary font-medium italic">
              Resultados para: &quot;{query}&quot;
            </p>
          )}
        </header>

        <div className="flex flex-col lg:grid lg:grid-cols-[240px_1fr] gap-12 lg:gap-20">
          <Suspense fallback={<div className="h-64 bg-sand/10 rounded-3xl animate-pulse" />}>
            <FilterSidebar />
          </Suspense>

          <div className="space-y-10">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-muted border-b border-sand pb-4">
              <span>{products?.length || 0} prendas en el mercado</span>
            </div>

            {products && products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
                {products.map((p) => (
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
              <div className="py-32 text-center bg-white/40 rounded-[40px] border-2 border-dashed border-sand">
                <p className="text-muted">No encontramos lo que buscas. Prueba con otra marca o categoría.</p>
              </div>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}
