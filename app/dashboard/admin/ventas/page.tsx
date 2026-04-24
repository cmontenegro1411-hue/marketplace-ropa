import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
export default async function AdminSalesPage() {
  // Obtener órdenes con detalles
  const { data: orders, error } = await supabaseAdmin
    .from('orders')
    .select('*, order_items(status)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching orders:", error);
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-serif font-bold text-primary mb-2">Registro de Ventas</h1>
        <p className="text-muted text-sm font-medium italic">Historial completo de pedidos y estados de pago.</p>
      </div>

      <div className="bg-white rounded-[2.5rem] editorial-shadow border border-sand/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-sand/30">
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-muted">ID Orden / Fecha</th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-muted">Comprador</th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-muted">Prendas</th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-muted">Monto</th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-muted">Comisión (IA + Pl)</th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-muted">Estado de Pago</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand/20">
              {orders?.map((order: any) => (
                <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <p className="text-[10px] font-bold text-primary mb-1 uppercase tracking-tighter">#{order.id.substring(0, 8)}</p>
                    <p className="text-[10px] text-muted font-medium italic">
                      {new Date(order.created_at).toLocaleDateString()} {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-sm font-bold text-primary">{order.buyer_name}</p>
                    <p className="text-[10px] text-muted font-medium">{order.buyer_email}</p>
                    <p className="text-[10px] text-muted font-medium">{order.buyer_phone}</p>
                  </td>
                  <td className="px-8 py-6 max-w-xs">
                     <p className="text-xs text-primary font-medium truncate">
                       {Array.isArray(order.items) 
                         ? order.items.map((it: any) => `${it.brand || ''} ${it.title}`).join(', ')
                         : 'Ver detalles'
                       }
                     </p>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-sm font-bold text-accent">S/ {order.total_amount}</p>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-sm font-bold text-slate-500">S/ {order.mp_application_fee || '0.00'}</p>
                  </td>
                  <td className="px-8 py-6">
                    <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${
                      order.payment_status === 'completed' 
                        ? (order.order_items?.some((it: any) => it.status === 'pending') 
                            ? 'bg-amber-50 text-amber-600 border border-amber-100' 
                            : 'bg-[#00E0A6]/10 text-[#008F6A]')
                        : order.payment_status === 'refunded'
                          ? 'bg-red-50 text-red-500 border border-red-100'
                          : 'bg-orange-100 text-orange-600'
                    }`}>
                      {order.payment_status === 'completed' 
                        ? (order.order_items?.some((it: any) => it.status === 'pending') ? 'Por Confirmar' : 'Completado') 
                        : order.payment_status === 'refunded' ? 'Reembolsado' : 'Pendiente'}
                    </div>
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
