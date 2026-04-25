import { supabaseAdmin } from "@/lib/supabase-admin";
import { 
  TrendingUp, 
  Users as UsersIcon, 
  Clock
} from "lucide-react";

export const revalidate = 0; // Datos siempre frescos

export default async function AdminCRMPage() {
  // 1. Obtener métricas
  // Solo contamos ventas completadas que NO han sido reembolsadas
  const { data: salesData } = await supabaseAdmin
    .from('orders')
    .select('total_amount, payment_status, order_items(status)')
    .or('payment_status.eq.completed,payment_status.eq.pendiente');

  const { count: sellerCount } = await supabaseAdmin
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'seller');

  // Solo contabilizamos si TODOS los items de la orden están 'completed'
  const totalSalesValue = salesData
    ?.filter(o => o.payment_status === 'completed')
    .reduce((acc, curr: any) => {
      const isConfirmed = curr.order_items?.length > 0 && curr.order_items.every((item: any) => item.status === 'completed');
      return isConfirmed ? acc + (curr.total_amount || 0) : acc;
    }, 0) || 0;

  // Pendientes = Pago pendiente O Pago completado pero items en Escrow (pending/shipped)
  const pendingOrdersCount = salesData?.filter((order: any) => {
    if (order.payment_status === 'pendiente') return true;
    if (order.payment_status === 'completed') {
      return order.order_items?.some((item: any) => item.status === 'pending' || item.status === 'shipped');
    }
    return false;
  }).length || 0;

  const { data: recentOrders } = await supabaseAdmin
    .from('orders')
    .select('*, order_items(status)')
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

        <div className="space-y-4">
          {recentOrders?.map((order: any) => (
            <div key={order.id} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-sand/30 hover:bg-white transition-all transform hover:-translate-x-1">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-primary text-cream rounded-full flex items-center justify-center font-bold text-xs uppercase">
                  {order.buyer_name?.substring(0, 2) || '??'}
                </div>
                <div>
                  <p className="text-sm font-bold text-primary">{order.buyer_name}</p>
                  <p className="text-[10px] text-muted font-medium uppercase tracking-tighter">{new Date(order.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="text-right flex items-center gap-6">
                <div>
                  <p className="text-sm font-bold text-accent">S/ {order.total_amount}</p>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest transition-colors ${getStatusStyles(getOrderDisplayStatus(order))}`}>
                  {getStatusLabel(getOrderDisplayStatus(order))}
                </div>
              </div>
            </div>
          ))}

          {(!recentOrders || recentOrders.length === 0) && (
            <p className="text-center py-10 text-muted italic">No hay actividad registrada aún.</p>
          )}
        </div>
      </div>
    </div>
  );
}
