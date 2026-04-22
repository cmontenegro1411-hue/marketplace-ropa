'use client';

import React, { useState } from 'react';
import { markAsShipped } from '@/app/actions/product-actions';

interface MarkAsShippedButtonProps {
  productId: string;
  title: string;
}

export const MarkAsShippedButton = ({ productId, title }: MarkAsShippedButtonProps) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleShip = async () => {
    const trackingNumber = prompt(`¿Deseas ingresar un número de rastreo para "${title}"? (Opcional)`);
    if (trackingNumber === null) return; // Canceló el prompt

    setIsProcessing(true);
    try {
      const res = await markAsShipped(productId, trackingNumber || undefined);
      if (res.success) {
        alert('¡Prenda marcada como enviada! Se ha notificado al comprador por correo electrónico.');
      } else {
        alert(res.error || 'Error al actualizar el estado.');
      }
    } catch (_error) {
      alert('Error inesperado.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <button
      onClick={handleShip}
      disabled={isProcessing}
      className="w-full py-3 bg-secondary text-cream rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-secondary/90 transition-all disabled:opacity-50"
    >
      {isProcessing ? '⏳ Procesando...' : 'Marcar como Enviado'}
    </button>
  );
};
