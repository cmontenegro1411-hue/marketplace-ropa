'use client';

import React, { useState } from 'react';
import { confirmConformity } from '@/app/actions/product-actions';

interface BuyerConformityButtonProps {
  productId: string;
}

export const BuyerConformityButton = ({ productId }: BuyerConformityButtonProps) => {
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirm = async () => {
    if (!confirm('¿Confirmas que recibiste la prenda y que todo está correcto? Esto liberará el pago al vendedor.')) {
      return;
    }

    setIsConfirming(true);
    try {
      const res = await confirmConformity(productId);
      if (!res.success) {
        alert(res.error || 'Error al confirmar conformidad');
      }
    } catch (_error) {
      alert('Error inesperado');
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <button
      onClick={handleConfirm}
      disabled={isConfirming}
      className="bg-primary hover:bg-primary/90 text-cream px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-50"
    >
      {isConfirming ? '⏳ Procesando...' : 'Confirmar Todo OK'}
    </button>
  );
};
