import { supabaseAdmin } from "@/lib/supabase-admin";
import { 
  TrendingUp, 
  Users as UsersIcon, 
  Clock, 
  Package 
} from "lucide-react";

export const revalidate = 0; // Datos siempre frescos

export default async function AdminCRMPage() {
  // 1. Obtener métricas
  const { data: salesData } = await supabaseAdmin
    .from('orders')
    .select('total_amount')
    .eq('payment_status', 'completed');

  const { count: sellerCount } = await supabaseAdmin
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'seller');

  const { count: pendingOrders } = await supabaseAdmin
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('payment_status', 'pendiente');

  const { data: recentOrders } = await supabaseAdmin
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  const totalSalesValue = salesData?.reduce((acc, curr) => acc + (curr.total_amount || 0), 0) || 0;

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
          <p className="text-xs text-muted mt-2 font-medium">Ingresos brutos acumulados</p>
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
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Pendientes</span>
          </div>
          <div className="text-4xl font-serif font-bold text-primary">{pendingOrders || 0}</div>
          <p className="text-xs text-muted mt-2 font-medium">Pedidos esperando confirmación</p>
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
                <div className={`px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${
                  order.payment_status === 'completed' 
                    ? 'bg-[#00E0A6]/10 text-[#008F6A]' 
                    : order.payment_status === 'refunded'
                      ? 'bg-red-50 text-red-500 border border-red-100'
                      : 'bg-slate-200 text-slate-500'
                }`}>
                  {order.payment_status === 'completed' ? 'Pagado' : order.payment_status === 'refunded' ? 'Reembolsado' : 'Pendiente'}
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
