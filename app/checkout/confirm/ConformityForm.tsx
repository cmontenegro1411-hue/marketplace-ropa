'use client';

import React, { useState } from 'react';
import { confirmConformityPublic } from "@/app/actions/product-actions";

interface ConformityFormProps {
  productId: string;
  token: string;
}

export function ConformityForm({ productId, token }: ConformityFormProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setError(null);

    try {
      const res = await confirmConformityPublic(productId, token);
      if (res.success) {
        setIsSuccess(true);
      } else {
        setError(res.error || 'Error al confirmar');
      }
    } catch (_err) {
      setError('Error inesperado');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="animate-in zoom-in fade-in duration-500 text-center">
        <div className="bg-[#00E0A6]/10 text-[#008F6A] p-8 rounded-3xl border border-[#00E0A6]/20">
           <h2 className="text-2xl font-serif font-bold mb-2">¡Confirmación Exitosa!</h2>
           <p className="text-sm">Gracias por ayudarnos a mantener segura la comunidad de Moda Circular.</p>
        </div>
        <p className="mt-8 text-muted text-[10px] uppercase tracking-widest font-bold">Puedes cerrar esta ventana ahora.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xs font-bold mb-6 border border-red-100">
          ❌ {error}
        </div>
      )}
      
      <button
        onClick={handleConfirm}
        disabled={isProcessing}
        className="w-full py-5 bg-primary text-cream rounded-full text-base font-bold uppercase tracking-widest shadow-xl hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? '⏳ Procesando...' : 'Sí, confirmo que todo está conforme'}
      </button>
    </div>
  );
}
