import { supabaseAdmin } from "@/lib/supabase-admin";
import { Banknote, Sparkles, TrendingUp, History, Download, ArrowUpRight, Wallet } from "lucide-react";
import ExportButton from "./ExportButton"; // Vamos a crear este componente cliente

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminCommissionsPage() {
  // 1. Obtener Ingresos Reales desde platform_revenue
  const { data: revenue, error: revenueError } = await supabaseAdmin
    .from('platform_revenue')
    .select(`
      *,
      users(name, email)
    `)
    .order('created_at', { ascending: false });

  // 2. Obtener items de órdenes para calcular comisiones "Pendientes" (Escrow)
  const { data: pendingItems, error: itemsError } = await supabaseAdmin
    .from('order_items')
    .select(`
      id,
      price,
      payout_amount,
      status,
      created_at,
      products(title, brand)
    `)
    .eq('status', 'pending');

  if (revenueError || itemsError) {
    console.error("Error fetching revenue data:", revenueError || itemsError);
  }

  // Cálculos de Ingresos Reales
  const salesCommissions = revenue?.filter(r => r.type === 'sales_commission')
    .reduce((acc, r) => acc + Number(r.amount), 0) || 0;
  
  const aiRevenue = revenue?.filter(r => r.type === 'credit_purchase' || r.type === 'plan_upgrade')
    .reduce((acc, r) => acc + Number(r.amount), 0) || 0;

  const totalRealRevenue = salesCommissions + aiRevenue;

  // Cálculos de Pendientes (Escrow)
  const totalPendingEscrow = pendingItems?.reduce((acc, item) => acc + (item.price || 0), 0) || 0;
  const potentialCommissions = pendingItems?.reduce((acc, item) => {
    const fee = (item.price || 0) - (item.payout_amount || 0);
    return acc + fee;
  }, 0) || 0;

  return (
    <div className="space-y-10 pb-20 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10 mb-4">
             <div className="w-1.5 h-1.5 rounded-full bg-[#00E0A6] animate-pulse" />
             <span className="text-[10px] font-bold uppercase tracking-widest text-primary/70">Finanzas en Vivo</span>
          </div>
          <h1 className="text-4xl font-serif font-bold text-primary mb-2">Libro de Ingresos</h1>
          <p className="text-muted text-sm font-medium italic">Auditoría centralizada de comisiones y servicios digitales.</p>
        </div>
        
        <ExportButton data={revenue || []} />
      </div>

      {/* KPIs Principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Ventas */}
        <div className="bg-white p-8 rounded-[2.5rem] editorial-shadow border border-sand/40 relative overflow-hidden group hover:border-primary/20 transition-all duration-500">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-10 group-hover:scale-110 transition-all duration-700">
            <Banknote className="w-24 h-24 text-primary" />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-4 flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-primary" />
            Comisiones por Ventas
          </p>
          <p className="text-3xl lg:text-5xl font-serif font-bold text-primary tracking-tighter">
            S/ {salesCommissions.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
          </p>
          <div className="mt-6 flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-[#00E0A6]/10 rounded-lg">
              <TrendingUp className="w-3 h-3 text-[#008F6A]" />
              <span className="text-[10px] font-bold text-[#008F6A] uppercase tracking-tighter">Realizado</span>
            </div>
            <span className="text-[10px] font-medium text-muted/60 italic">Excluye IGV y fees de pasarela</span>
          </div>
        </div>

        {/* IA */}
        <div className="bg-white p-8 rounded-[2.5rem] editorial-shadow border border-sand/40 relative overflow-hidden group hover:border-accent/20 transition-all duration-500">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-10 group-hover:scale-110 transition-all duration-700">
            <Sparkles className="w-24 h-24 text-accent" />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-4 flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-accent" />
            Venta de Créditos IA
          </p>
          <p className="text-3xl lg:text-5xl font-serif font-bold text-accent tracking-tighter">
            S/ {aiRevenue.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
          </p>
          <div className="mt-6 flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-accent/10 rounded-lg">
              <ArrowUpRight className="w-3 h-3 text-accent" />
              <span className="text-[10px] font-bold text-accent uppercase tracking-tighter">Servicios Digitales</span>
            </div>
          </div>
        </div>

        {/* Total y Pendientes */}
        <div className="bg-primary p-8 rounded-[2.5rem] shadow-[0_20px_50px_rgba(74,93,78,0.3)] relative overflow-hidden group hover:scale-[1.02] transition-all duration-500">
          <div className="absolute -bottom-6 -right-6 p-8 opacity-10">
            <Wallet className="w-32 h-32 text-cream" />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-cream/60 mb-4">Ingreso Total Neto</p>
          <p className="text-3xl lg:text-5xl font-serif font-bold text-cream tracking-tighter">
            S/ {totalRealRevenue.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
          </p>
          <div className="mt-8 pt-6 border-t border-cream/10">
            <div className="flex items-center justify-between">
               <span className="text-[10px] font-bold text-cream/50 uppercase tracking-widest">En Fideicomiso (Pendiente)</span>
               <span className="text-sm font-bold text-cream">S/ {potentialCommissions.toFixed(2)}</span>
            </div>
            <div className="w-full bg-cream/10 h-1 rounded-full mt-2 overflow-hidden">
               <div className="bg-[#00E0A6] h-full transition-all duration-1000" style={{ width: '40%' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Historial Detallado */}
      <div className="bg-white rounded-[3rem] editorial-shadow border border-sand/50 overflow-hidden">
        <div className="px-10 py-8 border-b border-sand/30 flex items-center justify-between bg-slate-50/30">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-primary/5 flex items-center justify-center">
              <History className="w-5 h-5 text-primary/70" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-xl text-primary">Libro Diario de Transacciones</h2>
              <p className="text-[10px] text-muted font-bold uppercase tracking-widest mt-0.5">Auditoría inmutable de ingresos</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white border border-sand/50 rounded-2xl shadow-sm">
             <span className="text-[10px] font-bold text-primary">{revenue?.length || 0}</span>
             <span className="text-[9px] font-bold text-muted uppercase tracking-widest">Operaciones</span>
          </div>
        </div>
        
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/20">
                <th className="px-10 py-6 text-[10px] font-bold uppercase tracking-widest text-muted border-b border-sand/20">Fecha</th>
                <th className="px-10 py-6 text-[10px] font-bold uppercase tracking-widest text-muted border-b border-sand/20">Usuario / Origen</th>
                <th className="px-10 py-6 text-[10px] font-bold uppercase tracking-widest text-muted border-b border-sand/20">Tipo</th>
                <th className="px-10 py-6 text-[10px] font-bold uppercase tracking-widest text-muted border-b border-sand/20">Referencia</th>
                <th className="px-10 py-6 text-[10px] font-bold uppercase tracking-widest text-muted border-b border-sand/20 text-right">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand/10">
              {revenue?.map((row: any) => (
                <tr key={row.id} className="hover:bg-slate-50/80 transition-all duration-300 group">
                  <td className="px-10 py-6">
                    <p className="text-xs font-bold text-primary/40 group-hover:text-primary transition-colors">
                      {new Date(row.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                    <p className="text-[9px] text-muted font-medium italic mt-1">
                      {new Date(row.created_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </td>
                  <td className="px-10 py-6">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-primary">{row.users?.name || 'Sistema'}</span>
                      <span className="text-[10px] text-muted truncate max-w-[150px]">{row.users?.email || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${
                      row.type === 'sales_commission' 
                      ? 'bg-[#00E0A6]/10 text-[#008F6A]' 
                      : 'bg-accent/10 text-accent'
                    }`}>
                      {row.type === 'sales_commission' ? 'Comisión Venta' : 'Venta Créditos'}
                    </span>
                  </td>
                  <td className="px-10 py-6">
                    <code className="text-[10px] bg-slate-100 px-2 py-1 rounded font-mono text-slate-500">
                      {row.reference_id?.slice(0, 15)}...
                    </code>
                  </td>
                  <td className="px-10 py-6 text-right">
                    <p className="text-base font-bold font-serif text-primary">
                      S/ {Number(row.amount).toFixed(2)}
                    </p>
                  </td>
                </tr>
              ))}
              {(!revenue || revenue.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-10 py-32 text-center">
                    <div className="flex flex-col items-center gap-4">
                       <div className="w-16 h-16 rounded-full bg-sand/20 flex items-center justify-center">
                          <Banknote className="w-8 h-8 text-sand" />
                       </div>
                       <p className="text-muted italic text-sm">No se han registrado ingresos en el libro diario todavía.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Vista Móvil (Cards) */}
        <div className="lg:hidden divide-y divide-sand/20">
          {revenue?.map((row: any) => (
            <div key={row.id} className="p-6 space-y-4 hover:bg-slate-50/50 transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-primary">{row.users?.name || 'Sistema'}</p>
                  <p className="text-[10px] text-muted font-medium">{row.users?.email || 'N/A'}</p>
                </div>
                <div className="text-right">
                    <p className="text-sm font-bold font-serif text-primary">S/ {Number(row.amount).toFixed(2)}</p>
                    <p className="text-[9px] text-muted font-bold uppercase tracking-widest mt-0.5">Monto Neto</p>
                </div>
              </div>

              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-sand/10">
                <div className="flex flex-col gap-1">
                    <span className="text-[9px] text-muted font-bold uppercase tracking-tight">Tipo de Ingreso</span>
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest w-fit ${
                      row.type === 'sales_commission' 
                      ? 'bg-[#00E0A6]/10 text-[#008F6A]' 
                      : 'bg-accent/10 text-accent'
                    }`}>
                      {row.type === 'sales_commission' ? 'Comisión Venta' : 'Venta Créditos'}
                    </span>
                </div>
                <div className="text-right flex flex-col gap-1">
                    <span className="text-[9px] text-muted font-bold uppercase tracking-tight">Referencia</span>
                    <code className="text-[9px] bg-white px-2 py-0.5 rounded border border-sand/20 font-mono text-slate-500">
                        {row.reference_id?.slice(0, 10)}...
                    </code>
                </div>
              </div>

              <div className="flex justify-between items-center text-[10px] text-muted italic">
                <p>{new Date(row.created_at).toLocaleDateString('es-PE')}</p>
                <p>{new Date(row.created_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>
          ))}

          {(!revenue || revenue.length === 0) && (
            <div className="px-8 py-20 text-center text-muted italic text-sm">
              No se han registrado ingresos todavía.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
