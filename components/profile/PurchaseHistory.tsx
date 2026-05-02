'use client';

import React from 'react';
import { OrderActionButtons } from "./OrderActionButtons";
import { BadgeCheck, Package, Truck, AlertCircle, RotateCcw, Calendar, Tag, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface PurchaseHistoryProps {
  purchases: any[];
}

export function PurchaseHistory({ purchases }: PurchaseHistoryProps) {
  if (!purchases || purchases.length === 0) {
    return (
      <div className="py-20 text-center bg-white/50 rounded-3xl border border-dashed border-sand">
        <div className="w-16 h-16 bg-sand/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Package className="text-muted w-8 h-8" />
        </div>
        <p className="text-primary font-serif text-lg font-bold">Aún no tienes compras</p>
        <p className="text-xs text-muted mt-2 font-medium">¡Explora el marketplace y dale una segunda vida a prendas increíbles!</p>
      </div>
    );
  }

  // Group purchases by order_id
  const ordersGrouped = purchases.reduce((acc, item) => {
    const orderId = item.order_id;
    if (!acc[orderId]) {
      acc[orderId] = {
        id: orderId,
        created_at: item.created_at,
        items: [],
        total: 0
      };
    }
    acc[orderId].items.push(item);
    acc[orderId].total += item.price;
    return acc;
  }, {} as Record<string, any>);

  const orders = Object.values(ordersGrouped).sort((a: any, b: any) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const getStatusConfig = (status: string, buyerConformity: boolean) => {
    if (buyerConformity || status === 'sold' || status === 'completed') {
      return {
        label: 'Entregado',
        color: 'bg-green-50 text-green-700 border-green-100',
        icon: <BadgeCheck className="w-3 h-3" />
      };
    }
    switch (status) {
      case 'shipped':
        return {
          label: 'En Camino',
          color: 'bg-blue-50 text-blue-700 border-blue-100',
          icon: <Truck className="w-3 h-3" />
        };
      case 'disputed':
        return {
          label: 'En Disputa',
          color: 'bg-red-50 text-red-700 border-red-100',
          icon: <AlertCircle className="w-3 h-3" />
        };
      case 'refunded':
        return {
          label: 'Reembolsado',
          color: 'bg-gray-50 text-gray-700 border-gray-100',
          icon: <RotateCcw className="w-3 h-3" />
        };
      default:
        return {
          label: 'Preparando Envío',
          color: 'bg-amber-50 text-amber-700 border-amber-100',
          icon: <Package className="w-3 h-3" />
        };
    }
  };

  return (
    <div className="space-y-8">
      {orders.map((order: any) => (
        <div key={order.id} className="bg-white rounded-[2.5rem] border border-sand overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
          {/* Order Header */}
          <div className="bg-cream/40 px-6 py-4 border-b border-sand flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-[10px] uppercase font-bold text-muted tracking-widest">Fecha del Pedido</p>
                <p className="text-sm font-bold text-primary flex items-center gap-1.5 mt-0.5">
                  <Calendar className="w-3.5 h-3.5 text-secondary" />
                  {new Date(order.created_at).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-muted tracking-widest">ID del Pedido</p>
                <p className="text-sm font-mono font-bold text-primary mt-0.5">#{order.id.split('-')[0].toUpperCase()}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-muted tracking-widest">Total</p>
                <p className="text-lg font-serif font-black text-accent mt-0.5">S/ {order.total.toFixed(2)}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-sand" />
            </div>
          </div>

          {/* Items List */}
          <div className="divide-y divide-sand/50">
            {order.items.map((item: any) => {
              const product = item.products;
              const statusConfig = getStatusConfig(item.status, product?.buyer_conformity);
              
              return (
                <div key={item.id} className="p-6 flex flex-col md:flex-row gap-6">
                  {/* Item Image */}
                  <div className="relative w-full md:w-24 h-32 md:h-24 rounded-xl overflow-hidden bg-cream shrink-0">
                    {product?.images?.[0] ? (
                      <img 
                        src={product.images[0]} 
                        alt={product?.title || 'Producto'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted">
                        <Package className="w-8 h-8 opacity-20" />
                      </div>
                    )}
                  </div>

                  {/* Item Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 bg-sand/30 text-muted text-[9px] font-bold uppercase tracking-widest rounded">
                        {product?.brand || 'Sin Marca'}
                      </span>
                      <span className="text-[10px] text-muted font-medium flex items-center gap-1">
                        <Tag className="w-3 h-3" /> {product?.size}
                      </span>
                    </div>
                    {product?.id ? (
                      <Link 
                        href={`/products/${product.id}`}
                        className="font-serif font-bold text-lg text-primary hover:text-secondary transition-colors line-clamp-1"
                      >
                        {product?.title || 'Producto'}
                      </Link>
                    ) : (
                      <span className="font-serif font-bold text-lg text-primary line-clamp-1 opacity-60">
                        {product?.title || 'Producto No Disponible'}
                      </span>
                    )}
                    
                    <div className="flex flex-wrap items-center gap-3 mt-3">
                      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${statusConfig.color}`}>
                        {statusConfig.icon}
                        {statusConfig.label}
                      </div>
                    </div>
                  </div>

                  {/* Item Actions */}
                  <div className="flex flex-col gap-2 shrink-0 md:justify-center md:items-end">
                    <OrderActionButtons 
                      productId={product?.id}
                      orderItemId={item.id}
                      sellerId={item.seller_id}
                      status={item.status}
                      buyerConformity={product?.buyer_conformity}
                      hasReview={item.product_reviews && item.product_reviews.length > 0}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="bg-sand/10 px-6 py-3 border-t border-sand/50">
            <p className="text-[9px] text-muted font-medium italic text-center">
              Tu compra está protegida por la Garantía Moda Circular. El pago se libera al vendedor solo tras tu conformidad.
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

