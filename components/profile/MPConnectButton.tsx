'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface MPConnectButtonProps {
  isConnected: boolean;
}

export function MPConnectButton({ isConnected }: MPConnectButtonProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');

    if (success === 'mp_connected') {
      setMessage({ text: '¡Mercado Pago conectado con éxito! Ya puedes recibir pagos.', type: 'success' });
    } else if (error) {
      setMessage({ text: `Error: ${error.replace(/_/g, ' ')}`, type: 'error' });
    }
  }, [searchParams]);

  if (isConnected) {
    return (
      <div className="flex items-center gap-2 px-6 py-2 bg-green-50 text-green-700 border border-green-200 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm h-fit">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
        MP Activo
      </div>
    );
  }

  return (
    <button 
      onClick={() => router.push('/api/auth/mercadopago/connect')}
      className="px-6 py-2 bg-[#009EE3] text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-[#0089c7] transition-all shadow-md flex items-center gap-2 h-fit"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
         <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12zM5 13h4v4H5v-4zm0-4h4v4H5V9zm5-4h4v4h-4V5zm0 4h4v4h-4V9zm5-4h4v4h-4V5zm0 4h4v4h-4V9z"/>
      </svg>
      Vincular MP
    </button>
  );
}
