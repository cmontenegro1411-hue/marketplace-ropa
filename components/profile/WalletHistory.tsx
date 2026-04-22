'use client';

import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Transaction {
  id: string;
  type: 'capture' | 'release' | 'refund' | 'withdrawal';
  amount: number;
  description: string;
  created_at: string;
  balance_after_pending?: number;
  balance_after_available?: number;
}

interface WalletHistoryProps {
  transactions: Transaction[];
}

export function WalletHistory({ transactions }: WalletHistoryProps) {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-dashed border-sand p-12 text-center">
        <div className="w-16 h-16 bg-cream rounded-full flex items-center justify-center mx-auto mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-sand" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-serif font-bold text-primary mb-1">Sin movimientos aún</h3>
        <p className="text-sm text-muted">Tus transacciones aparecerán aquí cuando realices ventas.</p>
      </div>
    );
  }

  const getTransactionStyles = (type: string) => {
    switch (type) {
      case 'capture':
        return {
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
          ),
          bg: 'bg-secondary/10',
          text: 'text-secondary',
          label: 'Captura (Escrow)',
          prefix: '+'
        };
      case 'release':
        return {
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          ),
          bg: 'bg-accent/10',
          text: 'text-accent',
          label: 'Liberado',
          prefix: ''
        };
      case 'withdrawal':
        return {
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          ),
          bg: 'bg-primary/10',
          text: 'text-primary',
          label: 'Retiro',
          prefix: '-'
        };
      default:
        return {
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          ),
          bg: 'bg-gray-100',
          text: 'text-gray-600',
          label: 'Otro',
          prefix: ''
        };
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(amount);
  };

  return (
    <div className="bg-white rounded-3xl border border-sand shadow-sm overflow-hidden transition-all hover:shadow-md">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-cream/50 border-b border-sand">
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted">Fecha</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted">Tipo</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted">Descripción</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted text-right">Monto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sand/50">
            {transactions.map((tx) => {
              const styles = getTransactionStyles(tx.type);
              return (
                <tr key={tx.id} className="hover:bg-cream/20 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-muted">
                      {format(new Date(tx.created_at), 'dd MMM, yyyy', { locale: es })}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${styles.bg} ${styles.text}`}>
                        {styles.icon}
                      </div>
                      <span className={`text-xs font-bold uppercase tracking-tight ${styles.text}`}>
                        {styles.label}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-primary font-medium line-clamp-1 group-hover:line-clamp-none transition-all">
                      {tx.description}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <span className={`text-sm font-bold ${styles.text}`}>
                      {styles.prefix}{formatCurrency(tx.amount)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="bg-cream/30 px-6 py-3 border-t border-sand">
        <p className="text-[9px] font-bold uppercase tracking-widest text-muted text-center">
          Mostrando las últimas {transactions.length} transacciones
        </p>
      </div>
    </div>
  );
}
