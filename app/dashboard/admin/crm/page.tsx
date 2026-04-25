import { supabaseAdmin } from "@/lib/supabase-admin";
import { 
  TrendingUp, 
  Users as UsersIcon, 
  Clock,
  Award,
  ShoppingBag,
  ArrowUpRight,
  UserCheck
} from "lucide-react";
import CRMFilters from "./CRMFilters";

export const revalidate = 0; 

export default async function AdminCRMPage({
  searchParams,
}: {
  searchParams: { from?: string; to?: string; preset?: string };
}) {
  const { from, to, preset } = searchParams;

  // 1. Definir rango de fechas para la consulta
  let startDate = from;
  let endDate = to;

  if (preset) {
    const now = new Date();
    if (preset === 'this_month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    } else if (preset === 'last_month') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      endDate = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();
    } else if (preset === 'last_3_months') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString();
    }
  }

  // 2. Obtener órdenes con filtros
  let query = supabaseAdmin
    .from('orders')
    .select(`
      id,
      total_amount,
      payment_status,
      created_at,
      buyer_name,
      buyer_email,
      order_items(
        price,
        status,
        seller_id,
        products(title, brand, users(name))
      )
    `);

  if (startDate) query = query.gte('created_at', startDate);
  if (endDate) query = query.lte('created_at', endDate);

  const { data: ordersData } = await query;

  const { count: sellerCount } = await supabaseAdmin
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'seller');

  // Métricas Principales
  const totalSalesValue = ordersData?.reduce((acc, order) => {
    const validItemsPrice = order.order_items?.reduce((sum: number, item: any) => {
      if (['pending', 'shipped', 'completed'].includes(item.status)) {
        return sum + (item.price || 0);
      }
      return sum;
    }, 0) || 0;
    return acc + validItemsPrice;
  }, 0) || 0;

  const pendingOrdersCount = ordersData?.filter((order: any) => {
    if (order.payment_status === 'pendiente') return true;
    if (order.payment_status === 'completed') {
      return order.order_items?.some((item: any) => item.status === 'pending' || item.status === 'shipped');
    }
    return false;
  }).length || 0;

  // --- Lógica de Rankings ---

  // Ranking Vendedores
  const sellerMap = new Map();
  ordersData?.forEach(order => {
    order.order_items?.forEach((item: any) => {
      if (['pending', 'shipped', 'completed'].includes(item.status)) {
        const sellerName = item.products?.users?.name || 'Desconocido';
        const current = sellerMap.get(item.seller_id) || { name: sellerName, total: 0, items: 0 };
        sellerMap.set(item.seller_id, {
          name: sellerName,
          total: current.total + (item.price || 0),
          items: current.items + 1
        });
      }
    });
  });

  const sellerRanking = Array.from(sellerMap.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  // Ranking Compradores
  const buyerMap = new Map();
  ordersData?.forEach(order => {
    // Normalizar email para evitar duplicados por mayúsculas/minúsculas y espacios
    const rawEmail = order.buyer_email || 'anónimo';
    const emailKey = rawEmail.toLowerCase().trim();
    
    // Solo contar el monto de ítems válidos (excluyendo devueltos/cancelados)
    const validOrderTotal = order.order_items?.reduce((sum: number, item: any) => {
      if (['pending', 'shipped', 'completed'].includes(item.status)) return sum + (item.price || 0);
      return sum;
    }, 0) || 0;

    if (validOrderTotal > 0) {
      const current = buyerMap.get(emailKey) || { 
        name: order.buyer_name || 'Comprador Anónimo', 
        email: rawEmail,
        total: 0, 
        orders: 0 
      };
      
      buyerMap.set(emailKey, {
        ...current,
        total: current.total + validOrderTotal,
        orders: current.orders + 1
      });
    }
  });

  const buyerRanking = Array.from(buyerMap.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-primary mb-2">CRM: Resumen de Negocio</h1>
          <p className="text-muted text-sm font-medium italic">Análisis estratégico y rendimiento de la comunidad.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-accent/10 rounded-2xl border border-accent/20">
          <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
          <span className="text-[10px] font-bold text-accent uppercase tracking-widest">Datos en Tiempo Real</span>
        </div>
      </div>

      <CRMFilters />

      {/* Grid de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2rem] editorial-shadow border border-sand/50 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 text-sand/20 group-hover:text-accent/10 transition-colors">
            <TrendingUp size={80} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4 text-accent">
              <TrendingUp size={20} />
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Ventas Netas</span>
            </div>
            <div className="text-4xl font-serif font-bold text-primary">S/ {totalSalesValue.toLocaleString()}</div>
            <p className="text-[10px] text-muted mt-2 font-bold uppercase tracking-tight">Periodo seleccionado</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] editorial-shadow border border-sand/50 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 text-sand/20 group-hover:text-primary/10 transition-colors">
            <UserCheck size={80} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4 text-primary">
              <UsersIcon size={20} />
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Vendedores Activos</span>
            </div>
            <div className="text-4xl font-serif font-bold text-primary">{sellerCount || 0}</div>
            <p className="text-[10px] text-muted mt-2 font-bold uppercase tracking-tight">Total en plataforma</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] editorial-shadow border border-sand/50 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 text-sand/20 group-hover:text-[#C2A58F]/10 transition-colors">
            <Clock size={80} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4 text-[#C2A58F]">
              <Clock size={20} />
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Items en Escrow</span>
            </div>
            <div className="text-4xl font-serif font-bold text-primary">{pendingOrdersCount || 0}</div>
            <p className="text-[10px] text-muted mt-2 font-bold uppercase tracking-tight">Por confirmar recibo</p>
          </div>
        </div>
      </div>

      {/* Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Ranking Vendedores */}
        <div className="bg-white p-8 rounded-[2.5rem] editorial-shadow border border-sand/50">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent/10 text-accent rounded-2xl flex items-center justify-center">
                <Award size={20} />
              </div>
              <h2 className="text-xl font-serif font-bold text-primary">Top Vendedores</h2>
            </div>
            <span className="text-[9px] font-bold uppercase tracking-widest text-muted bg-sand/20 px-3 py-1 rounded-full">Por Volumen</span>
          </div>

          <div className="space-y-4">
            {sellerRanking.length > 0 ? sellerRanking.map((s, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-sand/20 hover:bg-white transition-all group">
                <div className="flex items-center gap-4">
                  <div className="text-lg font-serif font-bold text-sand group-hover:text-accent transition-colors w-6">
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-primary uppercase tracking-tight">{s.name}</p>
                    <p className="text-[10px] text-muted font-medium">{s.items} prendas vendidas</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-accent">S/ {s.total.toLocaleString()}</p>
                  <div className="flex items-center gap-1 justify-end text-[9px] font-bold text-[#008F6A] uppercase tracking-tighter">
                    <ArrowUpRight size={10} />
                    Rendimiento
                  </div>
                </div>
              </div>
            )) : (
              <p className="text-center py-10 text-muted italic text-sm">No hay datos para este periodo.</p>
            )}
          </div>
        </div>

        {/* Ranking Compradores */}
        <div className="bg-white p-8 rounded-[2.5rem] editorial-shadow border border-sand/50">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                <ShoppingBag size={20} />
              </div>
              <h2 className="text-xl font-serif font-bold text-primary">Top Compradores</h2>
            </div>
            <span className="text-[9px] font-bold uppercase tracking-widest text-muted bg-sand/20 px-3 py-1 rounded-full">Por Gasto</span>
          </div>

          <div className="space-y-4">
            {buyerRanking.length > 0 ? buyerRanking.map((b, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-sand/20 hover:bg-white transition-all group">
                <div className="flex items-center gap-4">
                  <div className="text-lg font-serif font-bold text-sand group-hover:text-primary transition-colors w-6">
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-primary uppercase tracking-tight">{b.name}</p>
                    <p className="text-[10px] text-muted font-medium">{b.orders} pedidos realizados</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-primary">S/ {b.total.toLocaleString()}</p>
                  <p className="text-[9px] text-muted font-bold uppercase tracking-tighter">Gasto Total</p>
                </div>
              </div>
            )) : (
              <p className="text-center py-10 text-muted italic text-sm">No hay datos para este periodo.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
