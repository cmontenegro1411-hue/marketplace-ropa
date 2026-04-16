'use client';

import React, { useState } from 'react';

export function PayoutModal({ availableFunds }: { availableFunds: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const [method, setMethod] = useState<'yape' | 'plin' | 'banco'>('yape');
  const [account, setAccount] = useState('');
  const [amount, setAmount] = useState<string>(availableFunds.toString());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parseFloat(amount) > availableFunds) {
      alert("El monto supera tu saldo disponible");
      return;
    }
    
    setIsSubmitting(true);
    // Simular llamada a API
    await new Promise(r => setTimeout(r, 1500));
    alert("¡Solicitud de retiro enviada exitosamente! Se procesará en un máximo de 24h.");
    setIsSubmitting(false);
    setIsOpen(false);
    // Para recargar la pagina al acabar el retiro:
    // window.location.reload();
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        disabled={availableFunds <= 0}
        className="px-8 py-4 bg-primary text-cream rounded-full text-xs font-bold uppercase tracking-widest hover:bg-secondary transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Retirar Fondos
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-primary/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative animate-fade-in-up">
            <button onClick={() => setIsOpen(false)} className="absolute top-6 right-6 text-muted hover:text-primary">
               ✕
            </button>
            <h2 className="text-2xl font-serif font-bold text-primary mb-2">Solicitar Retiro</h2>
            <p className="text-sm text-muted mb-6">Transfiere tus ganancias a tu billetera digital o cuenta bancaria.</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-primary mb-2">Monto a retirar (S/)</label>
                <input 
                  type="number" 
                  step="0.10"
                  max={availableFunds}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-cream/30 border border-sand rounded-xl px-4 py-3 text-lg font-bold text-primary focus:outline-none focus:border-accent"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-primary mb-2">Método de Retiro</label>
                <div className="grid grid-cols-3 gap-2">
                  <button type="button" onClick={() => setMethod('yape')} className={`py-3 text-xs font-bold rounded-xl transition-all ${method === 'yape' ? 'bg-[#742284] text-white' : 'bg-cream text-muted hover:bg-sand'}`}>Yape</button>
                  <button type="button" onClick={() => setMethod('plin')} className={`py-3 text-xs font-bold rounded-xl transition-all ${method === 'plin' ? 'bg-black text-[#00E0A6]' : 'bg-cream text-muted hover:bg-sand'}`}>Plin</button>
                  <button type="button" onClick={() => setMethod('banco')} className={`py-3 text-xs font-bold rounded-xl transition-all ${method === 'banco' ? 'bg-primary text-cream' : 'bg-cream text-muted hover:bg-sand'}`}>Banco</button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-primary mb-2">
                  {method === 'banco' ? 'Número de Cuenta (CCI)' : 'Número de Celular'}
                </label>
                <input 
                  type="text" 
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  placeholder={method === 'banco' ? '0011-XXXX-XXXX-XXXX' : '999 888 777'}
                  className="w-full bg-cream/30 border border-sand rounded-xl px-4 py-3 text-primary focus:outline-none focus:border-accent font-mono text-sm"
                  required
                />
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full py-4 bg-primary text-cream rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-secondary transition-all disabled:opacity-70"
                >
                  {isSubmitting ? 'Procesando...' : 'Confirmar Retiro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
