import React from 'react';
import { Navbar } from "@/components/ui/Navbar";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { ProductGallery } from "@/components/product/ProductGallery";
import { SellerInfo } from "@/components/product/SellerInfo";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { notFound } from 'next/navigation';
import { getSellerReputation } from '@/app/actions/reputation-actions';
import { ReputationStars } from '@/components/product/ReputationStars';
import Link from 'next/link';
import { ProductBuySection } from "@/components/product/ProductBuySection";

export const dynamic = 'force-dynamic';

interface PageProps {
  params: {
    id: string;
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;

  // Validar si id es un UUID válido
  const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  
  if (!isValidUUID) {
    console.error(`[ProductDetail] Invalid UUID: "${id}"`);
    notFound();
  }

  // Fetch real Product from Supabase using admin to bypass RLS (needed for sold/private products)
  const { data: product, error: productError } = await supabaseAdmin
    .from('products')
    .select('*, sellers:users!seller_id(*)')
    .eq('id', id)
    .single();

  if (productError || !product) {
    console.error("[ProductDetail] Error fetching product:", {
      id,
      code: productError?.code,
      message: productError?.message,
      details: productError?.details || "No product found"
    });
    notFound();
  }

  const seller = product.sellers as any;
  
  console.log(`[ProductDetail] ID: ${id}, Seller ID: ${product.seller_id}`);
  const reputation = await getSellerReputation(product.seller_id);
  console.log(`[ProductDetail] Reviews found: ${reputation.reviews?.length || 0}`);

  // Prepare UI data
  const formattedProduct = {
    ...product,
    price: product.price || 0,
    images: product.images || [],
    seller: {
      name: 'Vendedor Verificado', // Anonimizar para privacidad según regla de negocio
      rating: reputation.rating,
      salesCount: reputation.reviewCount,
      location: seller?.ubigeo_code || 'PE',
      isVerified: true,
      sellerId: product.seller_id,
      hasReviews: reputation.reviews.length > 0
    }
  };

  return (
    <main className="min-h-screen bg-cream">
      <Navbar />

      <Container className="py-12">
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-16">
          
          {/* Left Column: Gallery */}
          <div>
            <ProductGallery images={formattedProduct.images} />
            
            {/* Sustainability Impact - Desktop */}
            {(() => {
              const cat = (formattedProduct.category || '').toLowerCase();
              const title = (formattedProduct.title || '').toLowerCase();
              let water = '2,700L';
              let co2 = '10kg';
              
              if (cat.includes('jean') || title.includes('jean') || cat.includes('pantalón') || title.includes('pantalón')) {
                water = '7,000L'; co2 = '33kg';
              } else if (cat.includes('vestido') || title.includes('vestido')) {
                water = '5,000L'; co2 = '20kg';
              } else if (cat.includes('zapato') || title.includes('zapato') || cat.includes('zapatilla') || title.includes('zapatilla')) {
                water = '8,000L'; co2 = '15kg';
              } else if (cat.includes('casaca') || title.includes('casaca') || cat.includes('abrigo') || title.includes('abrigo')) {
                water = '9,000L'; co2 = '40kg';
              } else if (cat.includes('cartera') || title.includes('cartera') || cat.includes('bolso') || title.includes('bolso')) {
                water = '3,000L'; co2 = '8kg';
              }

              return (
                <div className="hidden lg:block mt-12">
                  <div className="bg-primary/5 rounded-3xl p-8 border border-primary/10">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 10v4a5 5 0 0 1-10 0v-4"/><path d="M11 20H4a8 8 0 0 1 0-16h7"/></svg>
                        </div>
                        <div>
                          <h4 className="font-bold text-foreground">Impacto Positivo</h4>
                          <p className="text-xs text-muted leading-tight">Ahorro estimado por comprar segunda mano:</p>
                        </div>
                      </div>
                      <div className="flex gap-8">
                        <div className="text-center">
                          <p className="text-xl font-serif font-bold text-primary">{water}</p>
                          <p className="text-[10px] uppercase font-bold text-muted">Agua</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xl font-serif font-bold text-primary">{co2}</p>
                          <p className="text-[10px] uppercase font-bold text-muted">CO2</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted/60 leading-relaxed italic border-t border-primary/10 pt-4">
                      * Estas cifras representan los recursos necesarios para fabricar una prenda similar **nueva**. Al elegir esta pieza, evitas este consumo.
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Right Column: Info & Actions */}
          <div className="space-y-10">
            {/* Header Info */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-muted">{formattedProduct.brand}</span>
                <button className="text-muted hover:text-secondary transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                </button>
              </div>
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground leading-tight">
                {formattedProduct.title}
              </h1>
              <div className="flex items-center gap-6">
                <div className="text-4xl font-serif font-bold text-primary">S/ {formattedProduct.price}</div>
                <div className="px-4 py-1.5 rounded-full bg-sand text-xs font-bold uppercase tracking-wider text-muted">
                  {formattedProduct.condition}
                </div>
              </div>
            </div>

            {/* Sizes & Details Grid */}
            <div className="grid grid-cols-2 gap-4 py-6 border-y border-sand">
              <div>
                <p className="text-[10px] uppercase font-bold text-muted mb-1">Talla</p>
                <p className="text-lg font-bold text-foreground">{formattedProduct.size}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-muted mb-1">Categoría</p>
                <p className="text-lg font-bold text-foreground">{formattedProduct.category}</p>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-primary">Descripción</h4>
              <p className="text-muted leading-relaxed">
                {formattedProduct.description}
              </p>
            </div>

            {/* Buy Section */}
            <ProductBuySection product={{
              id: formattedProduct.id,
              title: formattedProduct.title,
              price: formattedProduct.price,
              images: formattedProduct.images,
              brand: formattedProduct.brand,
              size: formattedProduct.size,
              status: formattedProduct.status
            }} />


            {/* Seller Info Section */}
            <div className="pt-10">
              <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-6">Información del Vendedor</h4>
              <SellerInfo {...formattedProduct.seller} />
            </div>

          </div>
        </div>

        {/* Community Reviews Section */}
        {reputation.reviews && reputation.reviews.length > 0 && (
          <div id="reviews" className="mt-24 pt-16 border-t border-sand scroll-mt-24">
            <div className="max-w-3xl">
              <h3 className="text-3xl font-serif font-bold text-foreground mb-2">Opiniones sobre el Vendedor</h3>
              <p className="text-muted mb-12 italic">Las estrellas reflejan la experiencia general de otros compradores con este vendedor verificado.</p>
              
              <div className="space-y-10">
                {reputation.reviews.map((review, index) => (
                  <div key={index} className="group">
                    <div className="flex items-start justify-between mb-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-foreground">{review.reviewerName}</span>
                          <span className="w-1 h-1 rounded-full bg-sand"></span>
                          <span className="text-xs text-muted">
                            {new Date(review.date).toLocaleDateString('es-PE', { 
                              day: 'numeric', 
                              month: 'short', 
                              year: 'numeric' 
                            })}
                          </span>
                        </div>
                        <ReputationStars rating={review.rating} />
                      </div>
                    </div>
                    <p className="text-muted leading-relaxed">
                      {review.comment || "Sin comentarios adicionales."}
                    </p>
                    {index < reputation.reviews.length - 1 && (
                      <div className="h-px bg-sand/50 w-1/4 mt-10 group-hover:w-full transition-all duration-500"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Container>
    </main>
  );
}
