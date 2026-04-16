'use client';

import React, { useState } from 'react';
import { markAsAvailable } from "@/app/actions/product-actions";

interface MarkAvailableButtonProps {
  productId: string;
  title: string;
}

export function MarkAvailableButton({ productId, title }: MarkAvailableButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleRepublish = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const confirmed = window.confirm(
      `¿Estás seguro de que quieres volver a publicar "${title}"?\n\nEsto lo regresará al catálogo donde todos podrán verlo y reservarlo nuevamente. Haz esto si el comprador anterior canceló o no respondió.`
    );
    
    if (!confirmed) return;

    setIsProcessing(true);
    const result = await markAsAvailable(productId);
    
    if (!result.success) {
      alert("Error al intentar volver a publicar: " + result.error);
      setIsProcessing(false);
    }
  };

  return (
    <button
      onClick={handleRepublish}
      disabled={isProcessing}
      className={`absolute bottom-[5.5rem] right-4 w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center shadow-lg transition-all ${
        isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110 hover:bg-green-600'
      } z-20`}
      title={isProcessing ? "Procesando..." : "Volver a publicar al catálogo"}
    >
      {isProcessing ? (
        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
          <path d="M3 3v5h5"/>
        </svg>
      )}
    </button>
  );
}
