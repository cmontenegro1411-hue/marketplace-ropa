'use client';

import React, { useState } from 'react';
import { markAsShipped } from '@/app/actions/product-actions';

interface MarkAsShippedCheckboxProps {
  productId: string;
  title: string;
  isShipped?: boolean;
}

export function MarkAsShippedCheckbox({ productId, title, isShipped = false }: MarkAsShippedCheckboxProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [checked, setChecked] = useState(isShipped);

  const handleToggle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (checked || isProcessing) return;
    
    // Si el usuario marca el check
    if (e.target.checked) {
      const isConfirming = window.confirm(`¿Confirmas que ya enviaste la prenda "${title}" al comprador?`);
      if (!isConfirming) {
        e.target.checked = false;
        return;
      }

      const trackingNumber = prompt(`¿Deseas ingresar un número de rastreo o courier para "${title}"?\nEsto ayudará al comprador a seguir su pedido.`);
      
      // Si el usuario cancela el prompt (null), desmarcamos el check
      if (trackingNumber === null) {
        e.target.checked = false;
        return;
      }

      setIsProcessing(true);
      try {
        const res = await markAsShipped(productId, trackingNumber || undefined);
        if (res.success) {
          setChecked(true);
          alert('¡Genial! Hemos notificado al comprador que su prenda está en camino.');
          // Recargar la página para actualizar el estado global si es necesario
          window.location.reload();
        } else {
          setChecked(false);
          alert(res.error || 'Hubo un problema al actualizar el estado.');
        }
      } catch (error) {
        console.error('Error marking as shipped:', error);
        setChecked(false);
        alert('Ocurrió un error inesperado.');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  return (
    <div className={`absolute bottom-[5.5rem] left-4 z-20 transition-all duration-500 ${
      checked ? 'opacity-100 translate-y-0' : 'opacity-90 hover:opacity-100 hover:scale-[1.02]'
    }`}>
      <div className="flex items-center gap-2.5 bg-white/90 backdrop-blur-xl px-3.5 py-2 rounded-full border border-sand/50 shadow-lg shadow-primary/5 group/check overflow-hidden">
        {/* Glow effect when checked */}
        {checked && (
          <div className="absolute inset-0 bg-accent/5 animate-pulse pointer-events-none" />
        )}
        
        <div className="relative flex items-center justify-center">
          <input
            type="checkbox"
            checked={checked}
            onChange={handleToggle}
            disabled={checked || isProcessing}
            id={`shipped-check-${productId}`}
            className={`
              w-4.5 h-4.5 rounded border-sand/60 text-accent focus:ring-accent/20 transition-all cursor-pointer
              disabled:cursor-not-allowed disabled:opacity-80
              ${checked ? 'bg-accent border-accent' : 'bg-cream/50'}
            `}
          />
          
          {isProcessing && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-sm z-10">
              <svg className="animate-spin h-3 w-3 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          )}
        </div>

        <label 
          htmlFor={`shipped-check-${productId}`}
          className={`
            text-[10px] font-bold uppercase tracking-[0.1em] cursor-pointer transition-colors
            ${checked ? 'text-accent' : 'text-primary/60 group-hover/check:text-primary'}
            ${isProcessing ? 'animate-pulse' : ''}
          `}
        >
          {isProcessing ? 'Enviando...' : checked ? 'Prenda Enviada' : 'Prenda Enviada'}
        </label>
      </div>
    </div>
  );
}
