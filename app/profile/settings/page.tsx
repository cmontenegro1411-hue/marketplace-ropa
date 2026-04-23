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

  // Fetch real User Balance (Escrow)
  const { data: userData } = await supabaseAdmin
    .from('users')
    .select('balance_pending, balance_available')
    .eq('id', session.user.id)
    .single();

  const balancePending = userData?.balance_pending || 0;
  const balanceAvailable = userData?.balance_available || 0;

  const soldProducts = myProducts?.filter(p => p.status === 'sold') || [];
  const totalEarnings = soldProducts.reduce((acc, curr) => acc + (curr.price || 0), 0);
  const totalItemsSold = soldProducts.length;
  const totalPublished = myProducts?.length || 0;

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
            Métodos de Cobro
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
                <h2 className="text-2xl font-serif font-bold text-primary">Resumen General</h2>
                <div className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 bg-green-50 text-green-700 rounded-full border border-green-200">
                  Estado: Saludable
                </div>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="p-6 bg-gradient-to-br from-white to-sand/20 rounded-3xl border border-sand shadow-sm hover:shadow-md transition-shadow">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-2">Total Ingresos</p>
                  <p className="text-4xl font-serif font-bold text-primary">{formatCurrency(totalEarnings)}</p>
                  <p className="text-xs text-green-600 font-bold mt-2 flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
                    Histórico
                  </p>
                </div>
                
                <div className="p-6 bg-gradient-to-br from-white to-sand/20 rounded-3xl border border-sand shadow-sm hover:shadow-md transition-shadow">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-2">Prendas Vendidas</p>
                  <p className="text-4xl font-serif font-bold text-primary">{totalItemsSold}</p>
                  <p className="text-xs text-muted mt-2">De {totalPublished} publicadas</p>
                </div>

                <div className={`p-6 bg-gradient-to-br from-white to-sand/20 rounded-3xl border border-sand shadow-sm hover:shadow-md transition-shadow ${balancePending === 0 ? 'opacity-60' : ''}`}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-2">Próximo Pago</p>
                  <p className="text-3xl font-serif font-bold text-secondary mt-1">{formatCurrency(balancePending)}</p>
                  <p className="text-xs text-muted mt-2">
                    {balancePending > 0 ? 'Fondos en proceso de liberación' : 'No hay pagos en tránsito'}
                  </p>
                </div>
              </div>

              {/* Sales History */}
              <div className="pt-8">
                <h3 className="text-lg font-serif font-bold text-primary border-b border-sand pb-4 mb-6">Historial de Prendas Vendidas</h3>
                
                <div className="space-y-4">
                  {soldProducts.length === 0 ? (
                     <div className="py-12 text-center border-2 border-dashed border-sand rounded-3xl">
                       <p className="text-muted italic">No tienes historial de ventas aún.</p>
                     </div>
                  ) : (
                    soldProducts.map((order) => {
                      const hasBuyer = !!order.buyer_phone;
                      const msg = encodeURIComponent(`¡Hola ${order.buyer_name || 'Comprador'}! Vi que reservaste mi prenda "${order.title}" en Moda Circular. Te escribo para coordinar la entrega y el pago contraentrega.`);
                      const waLink = hasBuyer ? `https://wa.me/${order.buyer_phone}?text=${msg}` : '#';

                      return (
                        <div key={order.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 hover:bg-sand/20 rounded-2xl transition-colors border border-transparent hover:border-sand/50">
                          <div className="flex items-center gap-4 mb-4 sm:mb-0">
                            <img src={order.images?.[0] || '/placeholder-product.png'} alt={order.title} className="w-16 h-16 rounded-xl object-cover bg-sand shadow-sm" />
                            <div>
                              <p className="font-bold text-primary">{order.title}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] uppercase tracking-widest text-muted">ID: {order.id.slice(0, 8)}</span>
                                <span className="text-muted">•</span>
                                <span className="text-[10px] uppercase tracking-widest text-accent">{order.brand}</span>
                              </div>
                              {hasBuyer && (
                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                  <span className="text-xs font-medium text-muted">
                                    Reservado por <strong className="text-primary">{order.buyer_name}</strong>
                                  </span>
                                  <span className="text-muted hidden sm:inline">•</span>
                                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#25D366]">Tel: {order.buyer_phone}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between w-full sm:w-auto gap-4 sm:gap-6">
                            <div className="flex flex-col text-left sm:text-right w-full sm:w-auto">
                              <span className="text-lg font-serif font-bold text-primary">{formatCurrency(order.price)}</span>
                              <span className={`text-[10px] w-fit sm:ml-auto font-bold uppercase tracking-widest px-2 py-1 rounded-md bg-primary text-white`}>
                                VENDIDO
                              </span>
                            </div>
                            
                            {hasBuyer && (
                              <a href={waLink} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto px-4 py-2 bg-[#25D366] text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#20bd5a] transition-all flex items-center justify-center gap-2 shadow-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M11.996 0A12 12 0 000 12c0 2.112.553 4.218 1.635 6.06L.01 24l6.096-1.597A11.964 11.964 0 0011.996 24 12 12 0 0024 12 12 12 0 0011.996 0zm6.545 17.15c-.292.833-1.42 1.574-2.193 1.616-.628.03-1.428-.15-2.527-.604-4.216-1.745-6.936-6.074-7.143-6.353-.207-.278-1.705-2.274-1.705-4.34 0-2.067 1.07-3.085 1.455-3.5.353-.38 1.05-.595 1.536-.595.143 0 .27.006.38.013.38.018.57.037.82.639.317.763 1.082 2.65 1.176 2.842.095.192.16.417.065.61-.095.192-.143.313-.284.475-.14.162-.294.354-.423.493-.143.14-.294.293-.13.578.163.284.723 1.198 1.55 1.936 1.066.953 1.956 1.25 2.15 1.346.195.096.31.082.427-.053.116-.135.5-58.58-.727.784-.81.282-.027 1.306-2.5 1.44-4.887 2.05zm0 0"/></svg>
                                Escribir
                              </a>
                            )}
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
