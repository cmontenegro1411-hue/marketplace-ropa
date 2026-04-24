import React from 'react';
import { Container } from "@/components/ui/Container";
import { Navbar } from "@/components/ui/Navbar";
import Link from 'next/link';
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { auth } from "@/auth";
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SettingsAndReportsPage(props: { searchParams: Promise<{ tab?: string }> }) {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/login');
  }

  // Next.js 15 Promise resolution for searchParams
  const searchParams = await props.searchParams;
  const activeTab = searchParams.tab || 'reports';

  // Fetch real data from DB
  const { data: myProducts, error } = await supabase
    .from('products')
    .select('*')
    .eq('seller_id', session.user.id)
    .order('created_at', { ascending: false });

  if (error) console.error("Error fetching for reports:", error);

  // Fetch real User Balance
  const { data: userData } = await supabaseAdmin
    .from('users')
    .select('balance_pending, balance_available')
    .eq('id', session.user.id)
    .single();

  const balancePending = userData?.balance_pending || 0;
  const balanceAvailable = userData?.balance_available || 0;

  // Fetch detailed Order Items (Sales)
  const { data: salesItems } = await supabaseAdmin
    .from('order_items')
    .select(`
      *,
      products (title, brand, images)
    `)
    .eq('seller_id', session.user.id);

  const totalEarningsGross = myProducts?.filter(p => p.status === 'sold').reduce((acc, curr) => acc + (curr.price || 0), 0) || 0;
  const totalItemsSold = myProducts?.filter(p => p.status === 'sold').length || 0;
  const totalPublished = myProducts?.length || 0;

  // Cálculos de disputa
  const disputedNetAmount = salesItems
    ?.filter(item => item.status === 'disputed' || item.status === 'refund_requested')
    .reduce((acc, curr) => acc + (curr.payout_amount || 0), 0) || 0;
  
  const cleanBalancePending = Math.max(0, balancePending - disputedNetAmount);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(amount);
  };

  return (
    <div className="min-h-screen bg-sand/30 pb-20">
      <Navbar />
      
      <Container className="py-12 max-w-5xl">
        <header className="mb-10">
          <Link href="/profile" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted hover:text-primary transition-colors mb-6 group">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:-translate-x-1"><path d="m15 18-6-6 6-6"/></svg>
            Volver a Mi Closet
          </Link>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl font-serif font-bold text-primary mb-2">Panel de Control</h1>
              <p className="text-muted italic">Tus ventas, configuración y análisis en un solo lugar.</p>
            </div>
          </div>
        </header>

        {/* Custom Server-driven Tabs */}
        <div className="flex gap-8 border-b border-sand mb-8 overflow-x-auto overflow-y-hidden pb-1 scrollbar-hide">
          <Link 
            href="/profile/settings?tab=reports"
            className={`whitespace-nowrap pb-4 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'reports' ? 'text-primary border-b-2 border-primary' : 'text-muted hover:text-primary'}`}
          >
            Reporte de Ventas
          </Link>
          <Link 
            href="/profile/settings?tab=payments"
            className={`whitespace-nowrap pb-4 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'payments' ? 'text-primary border-b-2 border-primary' : 'text-muted hover:text-primary'}`}
          >
            Billetera & Cobros
          </Link>
          <Link 
            href="/profile/settings?tab=security"
            className={`whitespace-nowrap pb-4 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'security' ? 'text-primary border-b-2 border-primary' : 'text-muted hover:text-primary'}`}
          >
            Seguridad & Alertas
          </Link>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl border border-sand min-h-[500px]">
          
          {/* REPORTS TAB */}
          {activeTab === 'reports' && (
            <div className="space-y-10 animate-fade-in">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-serif font-bold text-primary">Resumen Financiero</h2>
                <div className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 bg-green-50 text-green-700 rounded-full border border-green-200">
                  Estado: Saludable
                </div>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="p-6 bg-gradient-to-br from-white to-sand/20 rounded-3xl border border-sand shadow-sm hover:shadow-md transition-shadow">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-2">Ventas Totales (Bruto)</p>
                  <p className="text-4xl font-serif font-bold text-primary">{formatCurrency(totalEarningsGross)}</p>
                  <p className="text-xs text-muted mt-2">{totalItemsSold} prendas vendidas</p>
                </div>
                
                <div className={`p-6 bg-gradient-to-br from-white to-green-50/30 rounded-3xl border border-green-100 shadow-sm hover:shadow-md transition-shadow ${balanceAvailable === 0 ? 'opacity-60' : ''}`}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-green-700 mb-2">Saldo Disponible</p>
                  <p className="text-4xl font-serif font-bold text-green-800">{formatCurrency(balanceAvailable)}</p>
                  <p className="text-xs text-green-600 font-bold mt-2 flex items-center gap-1 italic">
                    ✓ Fondos liberados para cobro
                  </p>
                </div>

                <div className={`p-6 bg-gradient-to-br from-white to-sand/20 rounded-3xl border shadow-sm hover:shadow-md transition-all ${disputedNetAmount > 0 ? 'border-orange-200' : 'border-sand'} ${balancePending === 0 ? 'opacity-60' : ''}`}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-2">En Fideicomiso (Próximo Pago)</p>
                  <p className="text-3xl font-serif font-bold text-secondary mt-1">{formatCurrency(balancePending)}</p>
                  
                  <div className="text-xs mt-4 space-y-3 pt-3 border-t border-sand/30">
                    {cleanBalancePending > 0 && (
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-muted font-medium">
                          <span>Por liberar:</span>
                          <span className="font-bold">{formatCurrency(cleanBalancePending)}</span>
                        </div>
                        <p className="text-[10px] text-muted italic flex items-center gap-1.5">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-sand-600"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                          Esperando confirmación del comprador
                        </p>
                      </div>
                    )}
                    
                    {disputedNetAmount > 0 && (
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-orange-600 font-bold">
                          <span>En Disputa:</span>
                          <span>{formatCurrency(disputedNetAmount)}</span>
                        </div>
                        <p className="text-[10px] text-orange-500 italic font-bold flex items-center gap-1.5">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                          Fondo retenido por reclamo activo
                        </p>
                      </div>
                    )}

                    {balancePending === 0 && (
                      <p className="text-muted italic py-1">No hay pagos pendientes en este momento.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Sales History */}
              <div className="pt-8">
                <div className="flex justify-between items-center border-b border-sand pb-4 mb-6">
                  <h3 className="text-lg font-serif font-bold text-primary">Detalle de Ventas y Comisiones</h3>
                </div>
                
                <div className="space-y-4">
                  {!salesItems || salesItems.length === 0 ? (
                     <div className="py-12 text-center border-2 border-dashed border-sand rounded-3xl">
                       <p className="text-muted italic">Aún no tienes ventas registradas en el sistema financiero.</p>
                     </div>
                  ) : (
                    salesItems.map((item: any) => {
                      const product = item.products;
                      const statusColors = {
                        pending: 'bg-sand text-secondary',
                        completed: 'bg-green-100 text-green-800',
                        disputed: 'bg-red-100 text-red-800',
                        refund_requested: 'bg-orange-100 text-orange-800'
                      };
                      const statusLabels = {
                        pending: 'EN FIDEICOMISO',
                        completed: 'LIBERADO',
                        disputed: 'EN DISPUTA',
                        refund_requested: 'RECLAMO ACTIVO'
                      };

                      return (
                        <div key={item.id} className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-6 hover:bg-sand/10 rounded-3xl transition-colors border border-sand/50">
                          <div className="flex items-center gap-4 mb-4 lg:mb-0">
                            <img src={product?.images?.[0] || '/placeholder-product.png'} alt={product?.title} className="w-20 h-20 rounded-2xl object-cover bg-sand shadow-sm" />
                            <div>
                              <p className="font-bold text-primary text-lg">{product?.title}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] uppercase tracking-widest text-muted font-bold">{product?.brand}</span>
                                <span className="text-muted">•</span>
                                <span className={`text-[9px] font-bold uppercase tracking-[0.15em] px-2 py-0.5 rounded-full ${(statusColors as any)[item.status] || 'bg-sand'}`}>
                                  {(statusLabels as any)[item.status] || item.status}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-6 w-full lg:w-auto pt-4 lg:pt-0 border-t lg:border-t-0 border-sand/50">
                            <div className="flex flex-col">
                              <span className="text-[9px] font-bold uppercase tracking-widest text-muted mb-1">Precio</span>
                              <span className="text-sm font-bold text-primary">{formatCurrency(item.price)}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[9px] font-bold uppercase tracking-widest text-muted mb-1">Comisión (10%)</span>
                              <span className="text-sm font-medium text-red-500">-{formatCurrency(item.price * 0.10)}</span>
                            </div>
                            <div className="flex flex-col text-right">
                              <span className="text-[9px] font-bold uppercase tracking-widest text-primary mb-1">Neto a Recibir</span>
                              <span className="text-lg font-serif font-bold text-primary">{formatCurrency(item.payout_amount)}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* PAYMENTS TAB (Placeholder) */}
          {activeTab === 'payments' && (
            <div className="py-16 text-center animate-fade-in">
              <div className="w-16 h-16 bg-cream rounded-full flex items-center justify-center mx-auto mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-secondary"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
              </div>
              <h2 className="text-2xl font-serif font-bold text-primary mb-2">Tus Ganancias</h2>
              <p className="text-muted max-w-md mx-auto mb-8">
                Próximamente podrás vincular tu cuenta bancaria o Yape/Plin para recibir el dinero de tus ventas de manera automática.
              </p>
              <button disabled className="px-6 py-3 bg-sand text-muted font-bold rounded-full cursor-not-allowed">
                Vincular Cuenta (Muy pronto)
              </button>
            </div>
          )}

          {/* SECURITY TAB (Placeholder) */}
          {activeTab === 'security' && (
            <div className="py-16 text-center animate-fade-in">
              <div className="w-16 h-16 bg-cream rounded-full flex items-center justify-center mx-auto mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </div>
              <h2 className="text-2xl font-serif font-bold text-primary mb-2">Seguridad de la Cuenta</h2>
              <p className="text-muted max-w-md mx-auto">
                Aquí podrás cambiar tu contraseña, configurar la autenticación en dos pasos y gestionar tus notificaciones por email.
              </p>
            </div>
          )}

        </div>
      </Container>
    </div>
  );
}
