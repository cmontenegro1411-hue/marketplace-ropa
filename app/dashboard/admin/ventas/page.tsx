import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
export default async function AdminSalesPage() {
  // Obtener órdenes con detalles de items y productos asociados
  const { data: orders, error } = await supabaseAdmin
    .from('orders')
    .select(`
      *,
      order_items(
        id,
        status,
        price,
        payout_amount,
        product_id,
        products(title, brand, seller_id, users(name))
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching orders:", error);
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-serif font-bold text-primary mb-2">Registro de Ventas</h1>
        <p className="text-muted text-sm font-medium italic">Historial completo de pedidos y estados de pago por prenda.</p>
      </div>

      <div className="bg-white rounded-[2.5rem] editorial-shadow border border-sand/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-sand/30">
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-muted whitespace-nowrap">Orden / Fecha</th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-muted">Comprador</th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-muted">Detalle de Prendas</th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-muted">Total Pago</th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-muted">Estado Global</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand/20">
              {orders?.map((order: any) => (
                <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6 align-top">
                    <p className="text-[10px] font-bold text-primary mb-1 uppercase tracking-tighter">#{order.id.substring(0, 8)}</p>
                    <p className="text-[10px] text-muted font-medium italic whitespace-nowrap">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-[9px] text-muted/60 font-medium">
                      {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </td>
                  <td className="px-8 py-6 align-top">
                    <p className="text-sm font-bold text-primary">{order.buyer_name}</p>
                    <p className="text-[10px] text-muted font-medium mb-1">{order.buyer_email}</p>
                    <p className="text-[10px] text-muted font-medium">{order.buyer_phone}</p>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-4">
                      {order.order_items?.map((item: any) => (
                        <div key={item.id} className="flex flex-col gap-1 border-l-2 border-accent/20 pl-4 py-1">
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <p className="text-xs font-bold text-primary">
                                {item.products?.brand} {item.products?.title}
                              </p>
                              <p className="text-[9px] text-muted font-medium uppercase tracking-tight">
                                Vendedor: <span className="text-accent">{item.products?.users?.name || 'Desconocido'}</span>
                              </p>
                            </div>
                            <p className="text-xs font-bold text-slate-600 whitespace-nowrap">S/ {item.price}</p>
                          </div>
                          
                          {/* Badge de estado individual por prenda */}
                          <div className="mt-1">
                            {(() => {
                              const s = item.status;
                              if (s === 'refunded' || s === 'cancelled') 
                                return <span className="text-[8px] font-bold bg-red-50 text-red-500 px-2 py-0.5 rounded-md border border-red-100 uppercase tracking-tighter">Devuelto/Reembolsado</span>;
                              if (s === 'disputed')
                                return <span className="text-[8px] font-bold bg-orange-50 text-orange-600 px-2 py-0.5 rounded-md border border-orange-100 uppercase tracking-tighter">En Disputa</span>;
                              if (s === 'shipped')
                                return <span className="text-[8px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md border border-blue-100 uppercase tracking-tighter">Enviado</span>;
                              if (s === 'completed')
                                return <span className="text-[8px] font-bold bg-[#00E0A6]/10 text-[#008F6A] px-2 py-0.5 rounded-md border border-[#00E0A6]/20 uppercase tracking-tighter">Completado</span>;
                              return <span className="text-[8px] font-bold bg-amber-50 text-amber-600 px-2 py-0.5 rounded-md border border-amber-100 uppercase tracking-tighter">Pendiente</span>;
                            })()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-8 py-6 align-top">
                    {(() => {
                      const effectiveTotal = order.order_items?.reduce((sum: number, item: any) => {
                        if (item.status !== 'refunded' && item.status !== 'cancelled') {
                          return sum + (item.price || 0);
                        }
                        return sum;
                      }, 0) || 0;

                      return (
                        <>
                          <p className="text-sm font-bold text-accent">S/ {effectiveTotal}</p>
                          {effectiveTotal !== order.total_amount && (
                            <p className="text-[9px] text-muted line-through">S/ {order.total_amount}</p>
                          )}
                          <p className="text-[9px] text-muted font-medium mt-1 italic">
                            Comisión: S/ {order.mp_application_fee || '0.00'}
                          </p>
                        </>
                      );
                    })()}
                  </td>
                  <td className="px-8 py-6 align-top">
                    {(() => {
                      const allRefunded = order.payment_status === 'refunded' || (order.order_items?.length > 0 && order.order_items?.every((it: any) => it.status === 'refunded' || it.status === 'cancelled'));
                      const someRefunded = order.order_items?.some((it: any) => it.status === 'refunded' || it.status === 'cancelled');

                      const hasDispute = order.order_items?.some((it: any) => it.status === 'disputed');
                      const isPending = order.payment_status === 'completed' && order.order_items?.some((it: any) => it.status === 'pending' || it.status === 'shipped');

                      if (allRefunded) {
                        return (
                          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest bg-red-50 text-red-500 border border-red-100">
                            Reembolsado
                          </div>
                        );
                      }

                      if (hasDispute) {
                        return (
                          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest bg-orange-50 text-orange-600 border border-orange-100">
                            En Disputa
                          </div>
                        );
                      }

                      if (someRefunded) {
                        return (
                          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest bg-amber-50 text-amber-600 border border-amber-100">
                            Reembolso Parcial
                          </div>
                        );
                      }

                      if (isPending) {
                        return (
                          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest bg-blue-50 text-blue-600 border border-blue-100">
                            Por Confirmar
                          </div>
                        );
                      }

                      if (order.payment_status === 'completed') {
                        return (
                          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest bg-[#00E0A6]/10 text-[#008F6A]">
                            Completado
                          </div>
                        );
                      }

                      return (
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest bg-orange-100 text-orange-600">
                          Pendiente
                        </div>
                      );
                    })()}
                  </td>
                </tr>
              ))}

              {(!orders || orders.length === 0) && (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center text-muted italic">
                    No hay registros de ventas todavía.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
