'use client';

import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Transaction {
  id: string;
  type: 'capture' | 'release' | 'refund' | 'withdrawal';
  amount: number;
  description: string;
  created_at: string;
  order_item_id?: string;
  balance_after_pending?: number;
  balance_after_available?: number;
}

interface WalletHistoryProps {
  transactions: Transaction[];
  orderStatuses?: Record<string, string>;
}

export function WalletHistory({ transactions, orderStatuses }: WalletHistoryProps) {
  // Agrupar transacciones por order_item_id para limpiar la vista
  const combinedTransactions = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];
    
    const grouped = new Map<string, any>();
    const independent: any[] = [];

    transactions.forEach(tx => {
      // Limpiar el nombre del producto de prefijos técnicos
      const cleanProductName = tx.description
        .replace(/^(Venta \(Bypass\): |Venta: |Venta \(Pendiente\): |Cancelación: |Devolución: |Liberación: |Liberación por venta: )/i, '')
        .replace(/^(Clothing|Shoes|Accessories|Bags) > /i, '')
        .replace(/\(ID: .*\)$/i, '') // Quitar IDs técnicos al final
        .trim();

      if (tx.order_item_id) {
        if (!grouped.has(tx.order_item_id)) {
          grouped.set(tx.order_item_id, {
            id: tx.order_item_id,
            amount: tx.amount,
            productName: cleanProductName,
            captureDate: null,
            releaseDate: null,
            type: 'capture',
            isDisputed: orderStatuses?.[tx.order_item_id] === 'disputed' || orderStatuses?.[tx.order_item_id] === 'refund_requested'
          });
        }
        
        const g = grouped.get(tx.order_item_id);
        
        if (tx.type === 'capture') {
          g.captureDate = tx.created_at;
          if (cleanProductName && cleanProductName !== '') {
            g.productName = cleanProductName;
          }
        } else if (tx.type === 'release') {
          g.releaseDate = tx.created_at;
          g.type = 'release';
        } else if (tx.type === 'refund') {
          g.releaseDate = tx.created_at;
          g.type = 'refund';
        }
      } else {
        independent.push({
          id: tx.id,
          amount: tx.amount,
          productName: cleanProductName,
          description: tx.description, // Backup original
          captureDate: tx.type === 'capture' ? tx.created_at : null,
          releaseDate: tx.type !== 'capture' ? tx.created_at : null,
          type: tx.type,
          isDisputed: false
        });
      }
    });

    // Construir la descripción final con formato "Motivo (Prenda)"
    const processed = [...Array.from(grouped.values()), ...independent].map(item => {
      let reason = "";
      
      if (item.type === 'capture') reason = "Venta registrada en espera de entrega";
      else if (item.type === 'release') reason = "Venta completada y fondos liberados";
      else if (item.type === 'refund') reason = "Prenda retornada y reembolso procesado";
      else if (item.type === 'withdrawal') reason = "Retiro de fondos solicitado";
      else reason = "Movimiento de billetera";

      if (item.productName && item.type !== 'withdrawal') {
        item.description = `${reason} (${item.productName})`;
      } else if (!item.description) {
        item.description = reason;
      }

      return item;
    });

    return processed.sort((a, b) => {
      const dateA = new Date(a.captureDate || a.releaseDate || 0).getTime();
      const dateB = new Date(b.captureDate || b.releaseDate || 0).getTime();
      return dateB - dateA;
    });
  }, [transactions, orderStatuses]);

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

  const getTransactionStyles = (type: string, isDisputed?: boolean) => {
    if (isDisputed && type !== 'release' && type !== 'refund') {
      return {
        bg: 'bg-orange-100',
        text: 'text-orange-600',
        label: 'En Disputa',
        prefix: '+'
      };
    }

    switch (type) {
      case 'capture':
        return {
          bg: 'bg-secondary/10',
          text: 'text-secondary',
          label: 'Pendiente (Scrow)',
          prefix: '+'
        };
      case 'release':
        return {
          bg: 'bg-accent/10',
          text: 'text-accent',
          label: 'Liberado',
          prefix: '+'
        };
      case 'refund':
        return {
          bg: 'bg-red-100',
          text: 'text-red-600',
          label: 'Devuelto',
          prefix: '-'
        };
      case 'withdrawal':
        return {
          bg: 'bg-primary/10',
          text: 'text-primary',
          label: 'Retiro',
          prefix: '-'
        };
      default:
        return {
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

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '--';
    return format(new Date(dateString), 'dd MMM, yyyy', { locale: es });
  };

  return (
    <div className="bg-white rounded-3xl border border-sand shadow-sm overflow-hidden transition-all hover:shadow-md">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-cream/50 border-b border-sand">
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted">Descripción</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted">Estado</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted">Retenido</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted">Liberado</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted text-right">Monto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sand/50">
            {combinedTransactions.map((tx) => {
              const styles = getTransactionStyles(tx.type, tx.isDisputed);
              return (
                <tr key={tx.id} className="hover:bg-cream/20 transition-colors group">
                  <td className="px-6 py-4 max-w-xs">
                    <p className="text-sm text-primary font-medium line-clamp-1 group-hover:line-clamp-none transition-all" title={tx.description}>
                      {tx.description}
                    </p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight ${styles.bg} ${styles.text}`}>
                      {styles.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-muted">
                      {formatDate(tx.captureDate)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-muted">
                      {formatDate(tx.releaseDate)}
                    </span>
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
          Agrupando los últimos movimientos detectados
        </p>
      </div>
    </div>
  );
}
