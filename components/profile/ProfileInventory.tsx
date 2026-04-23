'use client';

import React, { useState } from 'react';
import { ProductCard } from "@/components/ui/ProductCard";
import { EditListingLink } from "@/components/product/EditListingLink";
import { DeleteListingButton } from "@/components/product/DeleteListingButton";
import { MarkAvailableButton } from "@/components/product/MarkAvailableButton";
import { ConfirmSaleButton } from "@/components/product/ConfirmSaleButton";
import { MarkAsShippedCheckbox } from "@/components/product/MarkAsShippedCheckbox";
import Link from 'next/link';

interface ProfileInventoryProps {
  products: any[];
}

export function ProfileInventory({ products }: ProfileInventoryProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'reserved' | 'sold'>('all');

  const activeProducts = products.filter(p => !p.status || p.status === 'available');
  const reservedProducts = products.filter(p => p.status === 'reserved');
  const soldProducts = products.filter(p => p.status === 'sold');

  const filteredProducts = {
    all: products,
    active: activeProducts,
    reserved: reservedProducts,
    sold: soldProducts
  }[activeTab];

  return (
    <div className="space-y-8">
      {/* Tabs */}
      <div className="flex items-center gap-8 border-b border-sand text-[10px] font-bold uppercase tracking-widest overflow-x-auto whitespace-nowrap scrollbar-hide">
        <button 
          onClick={() => setActiveTab('all')}
          className={`pb-4 transition-all ${activeTab === 'all' ? 'border-b-2 border-primary text-primary' : 'text-muted hover:text-primary'}`}
        >
          Todo ({products.length})
        </button>
        <button 
          onClick={() => setActiveTab('active')}
          className={`pb-4 transition-all ${activeTab === 'active' ? 'border-b-2 border-primary text-primary' : 'text-muted hover:text-primary'}`}
        >
          En Venta ({activeProducts.length})
        </button>
        <button 
          onClick={() => setActiveTab('reserved')}
          className={`pb-4 transition-all ${activeTab === 'reserved' ? 'border-b-2 border-secondary text-secondary' : 'text-muted hover:text-secondary'}`}
        >
          Reservas ({reservedProducts.length})
        </button>
        <button 
          onClick={() => setActiveTab('sold')}
          className={`pb-4 transition-all ${activeTab === 'sold' ? 'border-b-2 border-accent text-accent' : 'text-muted hover:text-accent'}`}
        >
          Vendido ({soldProducts.length})
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {activeTab === 'active' || activeTab === 'all' ? (
           /* Action Card: Upload More */
           <Link href="/dashboard/sell" className="aspect-[3/4] rounded-2xl border-2 border-dashed border-sand flex flex-col items-center justify-center p-6 text-center group cursor-pointer hover:border-primary/50 hover:bg-white transition-all order-first">
             <div className="w-12 h-12 bg-cream rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm">
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
             </div>
             <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Publicar Prenda</p>
           </Link>
        ) : null}

        {filteredProducts.map(product => (
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
            
            {/* Overlay de Acciones */}
            <div className="transition-opacity duration-300">
               <EditListingLink productId={product.id} />
               <DeleteListingButton productId={product.id} title={product.title} />
               
               {/* Reservado: vendedor puede marcar como enviado o revertir */}
               {product.status === 'reserved' && (
                 <>
                   <MarkAsShippedCheckbox productId={product.id} title={product.title} />
                   <MarkAvailableButton productId={product.id} title={product.title} />
                 </>
               )}
               
               {/* Enviado: vendedor puede confirmar venta (tras conformidad del comprador) */}
               {product.status === 'shipped' && (
                 <>
                   <MarkAsShippedCheckbox productId={product.id} title={product.title} isShipped />
                   <ConfirmSaleButton productId={product.id} title={product.title} />
                   <MarkAvailableButton productId={product.id} title={product.title} />
                 </>
               )}
               
            </div>
          </div>
        ))}
      </div>


      {filteredProducts.length === 0 && activeTab !== 'active' && activeTab !== 'all' && (
        <div className="py-20 text-center bg-white/50 rounded-3xl border border-dashed border-sand">
           <p className="text-muted italic">No hay prendas en esta sección.</p>
        </div>
      )}
    </div>
  );
}
