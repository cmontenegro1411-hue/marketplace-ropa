'use client';

import React, { useState } from 'react';
import { confirmSale } from "@/app/actions/product-actions";

interface ConfirmSaleButtonProps {
  productId: string;
  title: string;
}

export function ConfirmSaleButton({ productId, title }: ConfirmSaleButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirm = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const confirmed = window.confirm(
      `¿Confirmas que ya entregaste y recibiste el pago por "${title}"?\n\nEsto marcará la prenda como VENDIDA permanentemente y actualizará tus estadísticas en el CRM.`
    );
    
    if (!confirmed) return;

    setIsProcessing(true);
    const result = await confirmSale(productId);
    
    if (!result.success) {
      alert("Error al confirmar venta: " + result.error);
      setIsProcessing(false);
    }
  };

  return (
    <button
      onClick={handleConfirm}
      disabled={isProcessing}
      className={`absolute bottom-[5.5rem] right-16 w-10 h-10 bg-accent text-white rounded-full flex items-center justify-center shadow-lg transition-all ${
        isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110 hover:bg-accent/80'
      } z-20`}
      title={isProcessing ? "Procesando..." : "Confirmar Venta Concretada"}
    >
      {isProcessing ? (
        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6 9 17l-5-5"/>
        </svg>
      )}
    </button>
  );
}
