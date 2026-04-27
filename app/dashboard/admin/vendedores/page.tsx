import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function AdminSellersPage() {
  // 1. Obtener vendedores base
  const { data: sellers, error: sellersError } = await supabaseAdmin
    .from('users')
    .select(`
      id,
      name,
      email,
      whatsapp_number,
      created_at,
      balance_available,
      balance_pending,
      products!products_seller_id_fkey (count)
    `)
    .eq('role', 'seller')
    .order('created_at', { ascending: false });

  if (sellersError) {
    console.error("Error fetching sellers:", sellersError);
  }

  // 2. Obtener el resumen de transacciones por vendedor para calcular disputas
  const { data: orderItems, error: itemsError } = await supabaseAdmin
    .from('order_items')
    .select('seller_id, price, status, payout_amount');

  if (itemsError) {
    console.error("Error fetching order items for dashboard:", itemsError);
  }

  // 3. Procesar datos financieros por vendedor
  const processedSellers = sellers?.map(seller => {
    const sellerItems = orderItems?.filter(item => item.seller_id === seller.id) || [];
    
    // Volumen Bruto: Suma de precios de items activos (lo que pagó el cliente)
    const grossVolume = sellerItems
      .filter(item => ['pending', 'shipped', 'completed'].includes(item.status))
      .reduce((sum, item) => sum + (item.price || 0), 0);

    // Saldo Total en Billetera (Disponible + Pendiente)
    const totalVolume = (seller.balance_available || 0) + (seller.balance_pending || 0);
    const availableBalance = (seller.balance_available || 0);
    const pendingBalance = (seller.balance_pending || 0);

    // Suma de lo que está en disputa o solicitado para devolución
    const disputedAmount = sellerItems
      .filter(item => item.status === 'disputed' || item.status === 'refund_requested')
      .reduce((sum, item) => sum + (item.price || 0), 0);

    return {
      ...seller,
      grossVolume,
      totalVolume,
      availableBalance,
      pendingBalance,
      disputedAmount
    };
  });

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-serif font-bold text-primary mb-2">Directorio de Vendedores</h1>
        <p className="text-muted text-sm font-medium italic">Gestión de miembros y estadísticas financieras de la plataforma.</p>
      </div>

      <div className="bg-white rounded-[2.5rem] editorial-shadow border border-sand/50 overflow-hidden">
        {/* Vista Desktop (Tabla) */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-sand/30">
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-muted">Vendedor</th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-muted">Contacto</th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-muted text-center">Publicaciones</th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-muted">Ventas Efectivas</th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-muted">En Disputa</th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-muted text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand/20">
              {processedSellers?.map((seller: any) => (
                <tr key={seller.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-accent text-white rounded-full flex items-center justify-center font-bold text-xs">
                        {seller.name?.substring(0, 2).toUpperCase() || '??'}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-primary">{seller.name}</p>
                        <p className="text-[10px] text-muted tracking-tighter uppercase font-medium">ID: {seller.id.substring(0, 8)}...</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-xs font-medium text-primary mb-1">{seller.email}</p>
                    <p className="text-[10px] text-muted font-medium">{seller.whatsapp_number || 'Sin WhatsApp'}</p>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-lg font-serif font-bold text-primary">
                        {seller.products?.[0]?.count || 0}
                      </span>
                      <span className="text-[9px] text-muted font-bold uppercase">Prendas</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-1">
                      <div className="flex flex-col mb-2">
                        <p className="text-[10px] text-muted font-bold uppercase tracking-tight">Ventas Brutas</p>
                        <p className="text-sm font-bold text-primary">S/ {seller.grossVolume.toLocaleString()}</p>
                      </div>
                      <div className="pt-2 border-t border-sand/30">
                        <p className="text-[10px] text-muted font-bold uppercase tracking-tight">Ganancia Neta (Billetera)</p>
                        <p className="text-sm font-bold text-[#008F6A]">S/ {seller.availableBalance.toLocaleString()}</p>
                        {seller.pendingBalance > 0 && (
                          <p className="text-[9px] text-amber-600 font-bold uppercase tracking-tighter">
                            S/ {seller.pendingBalance.toLocaleString()} (En Garantía)
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    {seller.disputedAmount > 0 ? (
                      <div className="bg-orange-50 border border-orange-100 rounded-xl p-2 inline-block">
                        <p className="text-sm font-bold text-orange-600">S/ {seller.disputedAmount.toLocaleString()}</p>
                        <p className="text-[9px] text-orange-700 font-bold uppercase tracking-tight">Retención Activa</p>
                      </div>
                    ) : (
                      <p className="text-xs text-muted/40 font-medium italic">Sin disputas</p>
                    )}
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className="bg-[#00E0A6]/10 text-[#008F6A] text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                      Activo
                    </span>
                  </td>
                </tr>
              ))}

              {(!processedSellers || processedSellers.length === 0) && (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center text-muted italic">
                    No se encontraron vendedores registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Vista Móvil (Cards) */}
        <div className="lg:hidden divide-y divide-sand/20">
          {processedSellers?.map((seller: any) => (
            <div key={seller.id} className="p-6 space-y-6">
              {/* Header Card: Info Básica */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-accent text-white rounded-2xl flex items-center justify-center font-bold text-sm shadow-lg shadow-accent/20">
                    {seller.name?.substring(0, 2).toUpperCase() || '??'}
                  </div>
                  <div>
                    <p className="text-base font-bold text-primary">{seller.name}</p>
                    <p className="text-[10px] text-muted uppercase tracking-widest font-bold">Vendedor Activo</p>
                  </div>
                </div>
                <div className="text-right">
                    <p className="text-xl font-serif font-bold text-primary">{seller.products?.[0]?.count || 0}</p>
                    <p className="text-[8px] text-muted font-bold uppercase tracking-widest">Prendas</p>
                </div>
              </div>

              {/* Contacto */}
              <div className="grid grid-cols-2 gap-4 py-4 border-y border-sand/10">
                <div className="overflow-hidden">
                    <p className="text-[9px] text-muted font-bold uppercase tracking-tight mb-1">Email</p>
                    <p className="text-xs font-medium text-primary truncate">{seller.email}</p>
                </div>
                <div>
                    <p className="text-[9px] text-muted font-bold uppercase tracking-tight mb-1">WhatsApp</p>
                    <p className="text-xs font-medium text-primary">{seller.whatsapp_number || 'No reg.'}</p>
                </div>
              </div>

              {/* Finanzas Card */}
              <div className="bg-slate-50/80 rounded-2xl p-4 space-y-4 border border-sand/20">
                <div className="flex justify-between items-end">
                    <div>
                        <p className="text-[9px] text-muted font-bold uppercase tracking-tight mb-1">Ventas Brutas</p>
                        <p className="text-lg font-bold text-primary leading-none">S/ {seller.grossVolume.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[9px] text-muted font-bold uppercase tracking-tight mb-1 text-[#008F6A]">Billetera Disponible</p>
                        <p className="text-lg font-bold text-[#008F6A] leading-none">S/ {seller.availableBalance.toLocaleString()}</p>
                    </div>
                </div>

                {seller.pendingBalance > 0 && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-xl border border-amber-100">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        <p className="text-[9px] text-amber-700 font-bold uppercase tracking-tighter">
                            S/ {seller.pendingBalance.toLocaleString()} en garantía (Escrow)
                        </p>
                    </div>
                )}

                {seller.disputedAmount > 0 && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-xl border border-red-100">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        <p className="text-[9px] text-red-700 font-bold uppercase tracking-tight">
                            S/ {seller.disputedAmount.toLocaleString()} Retenido por disputa
                        </p>
                    </div>
                )}
              </div>
            </div>
          ))}

          {(!processedSellers || processedSellers.length === 0) && (
            <div className="px-8 py-20 text-center text-muted italic text-sm">
              No se encontraron vendedores registrados.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
