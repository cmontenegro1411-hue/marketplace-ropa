'use client';

import React, { useState } from 'react';
import { confirmConformity, disputeConformity } from '@/app/actions/product-actions';
import { ReviewForm } from "@/components/product/ReviewForm";

interface OrderActionButtonsProps {
  productId: string;
  orderItemId: string;
  sellerId: string;
  status: string;
  buyerConformity: boolean;
  hasReview?: boolean;
}

export function OrderActionButtons({ 
  productId, 
  orderItemId, 
  sellerId, 
  status, 
  buyerConformity,
  hasReview = false
}: OrderActionButtonsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  const handleConfirm = async () => {
    if (!confirm('¿Confirmas que recibiste la prenda y todo está correcto? Esto liberará el pago al vendedor.')) return;
    setIsLoading(true);
    try {
      const res = await confirmConformity(productId);
      if (!res.success) alert(res.error || 'Error al confirmar');
    } catch (err) {
      alert('Error inesperado');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDispute = async () => {
    const reason = prompt('Por favor, indica el motivo de la disputa (esto notificará al administrador):');
    if (!reason) return;
    
    setIsLoading(true);
    try {
      const res = await disputeConformity(productId);
      if (res.success) {
        alert('Disputa iniciada. El equipo de soporte revisará tu caso.');
      } else {
        alert(res.error || 'Error al iniciar disputa');
      }
    } catch (err) {
      alert('Error inesperado');
    } finally {
      setIsLoading(false);
    }
  };

  // Determinar qué botones mostrar
  const isShipped = status === 'shipped';
  const isFinalized = status === 'sold' || status === 'completed' || buyerConformity;
  const isDisputed = status === 'disputed';
  const isRefunded = status === 'refunded';

  if (isFinalized) {
    return (
      <>
        <button
          onClick={() => !hasReview && setShowReviewModal(true)}
          disabled={hasReview}
          className={`w-full md:w-auto px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-full border transition-all shadow-sm whitespace-nowrap ${
            hasReview 
              ? 'bg-green-50 text-green-600 border-green-100 cursor-default' 
              : 'bg-secondary/10 text-secondary border-secondary/20 hover:bg-secondary hover:text-white'
          }`}
        >
          {hasReview ? 'Calificación Enviada' : 'Calificar Vendedor'}
        </button>

        {showReviewModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-primary/20 backdrop-blur-md">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
              <div className="p-6 border-b border-sand flex justify-between items-center bg-cream/30">
                <h3 className="font-serif font-bold text-primary">Calificar Vendedor</h3>
                <button onClick={() => setShowReviewModal(false)} className="text-muted hover:text-primary transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              <div className="p-8">
                <ReviewForm 
                  sellerId={sellerId} 
                  orderId={orderItemId} 
                  onSuccess={() => setShowReviewModal(false)}
                  onCancel={() => setShowReviewModal(false)}
                />
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  if (isShipped) {
    return (
      <div className="flex flex-col gap-2 w-full">
        <button
          onClick={handleConfirm}
          disabled={isLoading}
          className="w-full md:w-auto px-6 py-2.5 bg-primary text-cream text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-primary/90 transition-all shadow-md disabled:opacity-50"
        >
          {isLoading ? 'Procesando...' : 'Confirmar Recepción'}
        </button>
        <button
          onClick={handleDispute}
          disabled={isLoading}
          className="w-full md:w-auto px-6 py-2.5 bg-white text-red-600 text-[10px] font-bold uppercase tracking-widest rounded-full border border-red-100 hover:bg-red-50 transition-all disabled:opacity-50"
        >
          Problema con el pedido
        </button>
      </div>
    );
  }

  if (isDisputed) {
    return (
      <div className="px-4 py-2 bg-red-50 rounded-full border border-red-100 text-center">
        <p className="text-[9px] font-bold uppercase tracking-widest text-red-600">
          En Disputa
        </p>
      </div>
    );
  }

  if (isRefunded) {
    return (
      <div className="px-4 py-2 bg-gray-50 rounded-full border border-gray-100 text-center">
        <p className="text-[9px] font-bold uppercase tracking-widest text-gray-500">
          Reembolsado
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 py-2 bg-sand/10 rounded-full border border-sand/30 text-center">
      <p className="text-[9px] font-bold uppercase tracking-widest text-muted">
        Esperando Envío
      </p>
    </div>
  );
}
