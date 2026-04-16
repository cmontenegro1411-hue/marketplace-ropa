import React from 'react';
import { Container } from "@/components/ui/Container";
import { auth } from "@/auth";
import { supabase } from "@/lib/supabase";
import { redirect } from 'next/navigation';
import { PayoutModal } from './PayoutModal';

export const dynamic = 'force-dynamic';

export default async function WalletDashboard() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  // Fetch balances (Pending vs Available)
  // For safety and fast iteration, we simulate the SQL if the table doesn't exist yet,
  // but ideally reading from 'orders' and 'payouts'.
  
  const { data: realOrders, error: ordersErr } = await supabase
    .from('orders')
    .select('*')
    .eq('seller_id', session.user.id)
    .order('created_at', { ascending: false });

  // Fallback si la migración no ha corrido aún
  const orders = ordersErr ? [] : (realOrders || []);

  const { data: realPayouts, error: payoutsErr } = await supabase
    .from('payouts')
    .select('*')
    .eq('seller_id', session.user.id)
    .order('created_at', { ascending: false });

  const payouts = payoutsErr ? [] : (realPayouts || []);

  // Calcular métricas
  const pendingFunds = orders.filter((o: any) => o.status === 'pending_delivery').reduce((sum: number, o: any) => sum + Number(o.seller_earnings), 0);
  const availableFunds = orders.filter((o: any) => o.status === 'completed').reduce((sum: number, o: any) => sum + Number(o.seller_earnings), 0) 
                         - payouts.filter((p: any) => p.status !== 'failed').reduce((sum: number, p: any) => sum + Number(p.amount), 0);
  const withdrawnFunds = payouts.filter((p: any) => p.status === 'completed').reduce((sum: number, p: any) => sum + Number(p.amount), 0);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(val);

  return (
    <div className="min-h-screen bg-[#FBF9F6] pt-32 pb-24">
      <Container>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
          <div>
            <div className="inline-block px-4 py-1.5 border border-accent/20 rounded-full mb-4 bg-white">
               <span className="text-secondary font-bold tracking-[0.5em] uppercase text-[9px]">Finanzas</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-primary tracking-tight mb-2">Mi Billetera</h1>
            <p className="text-muted text-lg">Consulta tus ganancias por ventas y solicita retiros a tu cuenta.</p>
          </div>
          <div>
             <PayoutModal availableFunds={availableFunds} />
          </div>
        </div>

        {/* Resumen Financiero */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="bg-primary text-cream p-8 rounded-[2rem] shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-secondary opacity-20 rounded-full blur-3xl -mr-10 -mt-10"></div>
            <p className="text-[10px] uppercase tracking-widest opacity-80 mb-2 font-bold">Saldo Disponible</p>
            <p className="text-5xl font-serif font-bold text-secondary">{formatCurrency(availableFunds || 0)}</p>
            <p className="text-xs mt-4 opacity-70">Dinero listo para ser retirado inmediatamente.</p>
          </div>

          <div className="bg-white border border-sand p-8 rounded-[2rem] shadow-sm">
            <p className="text-[10px] uppercase tracking-widest text-muted mb-2 font-bold cursor-help" title="Ventas realizadas que aún no han sido confirmadas como entregadas por el comprador.">Dinero en Tránsito ⏱</p>
            <p className="text-4xl font-serif font-bold text-primary">{formatCurrency(pendingFunds || 0)}</p>
            <p className="text-xs mt-4 text-muted">Se liberará cuando el cliente reciba la prenda.</p>
          </div>

          <div className="bg-white border border-sand p-8 rounded-[2rem] shadow-sm">
            <p className="text-[10px] uppercase tracking-widest text-muted mb-2 font-bold">Total Retirado</p>
            <p className="text-4xl font-serif font-bold text-accent">{formatCurrency(withdrawnFunds || 0)}</p>
            <p className="text-xs mt-4 text-muted">A lo largo del tiempo de tu tienda.</p>
          </div>
        </div>

        {/* Tablas de Actividad */}
        <div className="grid lg:grid-cols-2 gap-10">
          {/* Historial de Ventas */}
          <div className="bg-white rounded-[2rem] border border-sand shadow-sm overflow-hidden">
            <div className="p-6 border-b border-sand bg-cream/20 flex justify-between items-center">
              <h3 className="font-serif font-bold text-xl text-primary">Ventas Recientes</h3>
              <span className="text-xs text-muted font-medium bg-sand/50 px-3 py-1 rounded-full">Comisiones Deducidas</span>
            </div>
            <div className="p-0">
              {orders.length === 0 ? (
                <div className="p-10 text-center">
                  <p className="text-muted italic mb-4">Aún no tienes ventas registradas.</p>
                </div>
              ) : (
                <table className="w-full text-left text-sm">
                  <tbody>
                    {orders.map((o: any) => (
                      <tr key={o.id} className="border-b border-sand/30 last:border-0 hover:bg-cream/10 transition-colors">
                        <td className="p-5">
                           <p className="font-bold text-primary">{new Date(o.created_at).toLocaleDateString()}</p>
                           <p className="text-xs text-muted">Venta: {o.id.split('-')[0]}</p>
                        </td>
                        <td className="p-5">
                          {o.status === 'completed' && <span className="text-secondary text-xs uppercase tracking-widest font-bold">Entregado</span>}
                          {o.status === 'pending_delivery' && <span className="text-accent text-xs uppercase tracking-widest font-bold">En Tránsito</span>}
                        </td>
                        <td className="p-5 text-right font-bold text-primary text-lg">
                          +{formatCurrency(o.seller_earnings)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Historial de Retiros */}
          <div className="bg-white rounded-[2rem] border border-sand shadow-sm overflow-hidden">
             <div className="p-6 border-b border-sand bg-cream/20">
              <h3 className="font-serif font-bold text-xl text-primary">Historial de Retiros</h3>
            </div>
             <div className="p-0">
              {payouts.length === 0 ? (
                <div className="p-10 text-center">
                  <p className="text-muted italic mb-4">No has realizado retiros de fondos.</p>
                </div>
              ) : (
                 <table className="w-full text-left text-sm">
                  <tbody>
                    {payouts.map((p: any) => (
                      <tr key={p.id} className="border-b border-sand/30 last:border-0 hover:bg-cream/10 transition-colors">
                        <td className="p-5">
                           <p className="font-bold text-primary">{new Date(p.created_at).toLocaleDateString()}</p>
                           <p className="text-xs text-muted capitalize">Vía {p.method}</p>
                        </td>
                        <td className="p-5">
                          {p.status === 'completed' && <span className="text-secondary text-xs uppercase tracking-widest font-bold">Pagado</span>}
                          {p.status === 'pending' && <span className="text-accent text-xs uppercase tracking-widest font-bold">En Proceso</span>}
                        </td>
                        <td className="p-5 text-right font-bold text-primary text-lg">
                          -{formatCurrency(p.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

      </Container>
    </div>
  );
}
