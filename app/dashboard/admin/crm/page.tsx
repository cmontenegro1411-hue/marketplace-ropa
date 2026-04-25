import { supabaseAdmin } from "@/lib/supabase-admin";
import { 
  TrendingUp, 
  Users as UsersIcon, 
  Clock
} from "lucide-react";

export const revalidate = 0; // Datos siempre frescos

export default async function AdminCRMPage() {
  // 1. Obtener métricas
  // Traemos todas las órdenes pagadas o pendientes para procesar sus items
  const { data: ordersData } = await supabaseAdmin
    .from('orders')
    .select(`
      id,
      total_amount,
      payment_status,
      order_items(
        price,
        status,
        payout_amount
      )
    `)
    .or('payment_status.eq.completed,payment_status.eq.pendiente');

  const { count: sellerCount } = await supabaseAdmin
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'seller');

  // Cálculo de Ventas Realizadas: Suma de precios de items NO devueltos/cancelados
  // Usamos 'price' (monto pagado por el comprador) para GMV
  const totalSalesValue = ordersData?.reduce((acc, order) => {
    const validItemsPrice = order.order_items?.reduce((sum: number, item: any) => {
      // Solo sumamos si el item está pagado, enviado o completado
      if (['pending', 'shipped', 'completed'].includes(item.status)) {
        return sum + (item.price || 0);
      }
      return sum;
    }, 0) || 0;
    return acc + validItemsPrice;
  }, 0) || 0;

  // Pendientes = Pago pendiente O Pago completado pero items en Escrow (pending/shipped)
  const pendingOrdersCount = ordersData?.filter((order: any) => {
    if (order.payment_status === 'pendiente') return true;
    if (order.payment_status === 'completed') {
      return order.order_items?.some((item: any) => item.status === 'pending' || item.status === 'shipped');
    }
    return false;
  }).length || 0;

  const { data: recentOrders } = await supabaseAdmin
    .from('orders')
    .select(`
      *,
      order_items(
        id,
        price,
        status,
        products(title, brand, users(name))
      )
    `)
    .order('created_at', { ascending: false })
    .limit(10);

  // Función auxiliar para determinar el estado visual
  const getOrderDisplayStatus = (order: any) => {
    const allItems = order.order_items || [];
    const isFullyRefunded = allItems.length > 0 && allItems.every((it: any) => it.status === 'refunded' || it.status === 'cancelled');
    const hasDispute = allItems.some((it: any) => it.status === 'disputed');

    if (order.payment_status === 'refunded' || isFullyRefunded) return 'refunded';
    if (hasDispute) return 'disputed';

    if (order.payment_status === 'completed') {
      const hasEscrow = allItems.some((item: any) => item.status === 'pending' || item.status === 'shipped');
      return hasEscrow ? 'awaiting_confirmation' : 'completed';
    }
    return order.payment_status;
  };

  const getStatusLabel = (displayStatus: string) => {
    switch (displayStatus) {
      case 'completed': return 'Pagado';
      case 'awaiting_confirmation': return 'Por Confirmar';
      case 'refunded': return 'Devuelto';
      case 'disputed': return 'En Disputa';
      case 'pendiente': return 'Pendiente';
      case 'processing': return 'En Tránsito';
      default: return displayStatus;
    }
  };

  const getStatusStyles = (displayStatus: string) => {
    switch (displayStatus) {
      case 'completed': return 'bg-[#00E0A6]/10 text-[#008F6A]';
      case 'awaiting_confirmation': return 'bg-amber-50 text-amber-600 border border-amber-100';
      case 'refunded': return 'bg-red-50 text-red-500 border border-red-100';
      case 'disputed': return 'bg-orange-50 text-orange-600 border border-orange-100';
      case 'pendiente': return 'bg-slate-200 text-slate-500';
      default: return 'bg-slate-100 text-slate-400';
    }
  };

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-serif font-bold text-primary mb-2">CRM: Resumen de Negocio</h1>
        <p className="text-muted text-sm font-medium italic">Control centralizado de todas las operaciones de Moda Circular.</p>
      </div>

      {/* Grid de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2rem] editorial-shadow border border-sand/50">
          <div className="flex items-center gap-4 mb-4 text-accent">
            <TrendingUp size={24} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Ventas Realizadas</span>
          </div>
          <div className="text-4xl font-serif font-bold text-primary">S/ {totalSalesValue.toLocaleString()}</div>
          <p className="text-xs text-muted mt-2 font-medium">Ingresos netos (excluye devoluciones)</p>
        </div>

        <div className="bg-white p-8 rounded-[2rem] editorial-shadow border border-sand/50">
          <div className="flex items-center gap-4 mb-4 text-primary">
            <UsersIcon size={24} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Vendedores</span>
          </div>
          <div className="text-4xl font-serif font-bold text-primary">{sellerCount || 0}</div>
          <p className="text-xs text-muted mt-2 font-medium">Usuarios registrados como tienda</p>
        </div>

        <div className="bg-white p-8 rounded-[2rem] editorial-shadow border border-sand/50">
          <div className="flex items-center gap-4 mb-4 text-[#C2A58F]">
            <Clock size={24} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Pendientes / Escrow</span>
          </div>
          <div className="text-4xl font-serif font-bold text-primary">{pendingOrdersCount || 0}</div>
          <p className="text-xs text-muted mt-2 font-medium">Pagos pendientes y fondos en Escrow</p>
        </div>
      </div>

      {/* Actividad Reciente */}
      <div className="bg-white p-10 rounded-[2.5rem] editorial-shadow border border-sand/50 overflow-hidden">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-serif font-bold text-primary">Actividad Reciente</h2>
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted px-4 py-2 bg-sand/20 rounded-full">Últimos Pedidos</span>
        </div>

        <div className="space-y-6">
          {recentOrders?.map((order: any) => {
            const displayStatus = getOrderDisplayStatus(order);
            // Calcular el total efectivo (items no devueltos)
            const effectiveTotal = order.order_items?.reduce((sum: number, item: any) => {
              if (item.status !== 'refunded' && item.status !== 'cancelled') {
                return sum + (item.price || 0);
              }
              return sum;
            }, 0) || 0;

            return (
              <div key={order.id} className="p-6 bg-slate-50/50 rounded-[2rem] border border-sand/30 hover:bg-white transition-all shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary text-cream rounded-full flex items-center justify-center font-bold text-xs uppercase">
                      {order.buyer_name?.substring(0, 2) || '??'}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-primary">{order.buyer_name}</p>
                      <p className="text-[10px] text-muted font-medium uppercase tracking-tighter">
                        {new Date(order.created_at).toLocaleDateString()} • #{order.id.substring(0, 8)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-6">
                    <div>
                      <p className="text-lg font-serif font-bold text-accent">S/ {effectiveTotal}</p>
                      {effectiveTotal !== order.total_amount && (
                        <p className="text-[9px] text-muted line-through">Original: S/ {order.total_amount}</p>
                      )}
                    </div>
                    <div className={`px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest transition-colors ${getStatusStyles(displayStatus)}`}>
                      {getStatusLabel(displayStatus)}
                    </div>
                  </div>
                </div>

                {/* Desglose de Items */}
                <div className="mt-4 pl-14 space-y-3 border-l-2 border-sand/20">
                  {order.order_items?.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between group/item">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-primary/80">
                          {item.products?.brand} {item.products?.title}
                        </span>
                        <span className="text-[9px] text-muted font-medium uppercase tracking-tight">
                          Vendedor: <span className="text-accent/70">{item.products?.users?.name || 'Desconocido'}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`text-[8px] font-bold px-2 py-0.5 rounded uppercase tracking-tighter border ${
                          item.status === 'refunded' ? 'bg-red-50 text-red-500 border-red-100' :
                          item.status === 'completed' ? 'bg-green-50 text-green-600 border-green-100' :
                          'bg-slate-100 text-slate-500 border-slate-200'
                        }`}>
                          {item.status === 'refunded' ? 'Devuelto' : 
                           item.status === 'completed' ? 'Pagado' : 
                           item.status === 'pending' ? 'Por Confirmar' : item.status}
                        </span>
                        <span className="text-xs font-bold text-slate-500">S/ {item.price}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {(!recentOrders || recentOrders.length === 0) && (
            <p className="text-center py-10 text-muted italic">No hay actividad registrada aún.</p>
          )}
        </div>
      </div>
    </div>
  );
}
