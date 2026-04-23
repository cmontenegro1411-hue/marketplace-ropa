import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
export default async function AdminSellersPage() {
  // 1. Obtener vendedores con conteo de productos
  // Nota: En Supabase, para obtener el count de una relación usamos .select('*, products(count)')
  const { data: sellers, error } = await supabaseAdmin
    .from('users')
    .select(`
      id,
      name,
      email,
      whatsapp_number,
      created_at,
      products!products_seller_id_fkey (count),
      order_items!order_items_seller_id_fkey (price, status)
    `)
    .eq('role', 'seller')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching sellers:", error);
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-serif font-bold text-primary mb-2">Directorio de Vendedores</h1>
        <p className="text-muted text-sm font-medium italic">Gestión de miembros y estadísticas de publicación.</p>
      </div>

      <div className="bg-white rounded-[2.5rem] editorial-shadow border border-sand/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-sand/30">
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-muted">Vendedor</th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-muted">Contacto</th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-muted">Publicaciones</th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-muted">Total Ventas</th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-muted">Registro</th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-muted">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand/20">
              {sellers?.map((seller: any) => {
                const totalSales = seller.order_items?.reduce((sum: number, item: any) => 
                  item.status === 'completed' ? sum + (item.price || 0) : sum, 0) || 0;
                
                return (
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
                    <td className="px-8 py-6">
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-serif font-bold text-primary">
                          {seller.products?.[0]?.count || 0}
                        </span>
                        <span className="text-[10px] text-muted font-bold uppercase">Prendas</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                       <p className="text-sm font-bold text-accent">S/ {totalSales.toLocaleString()}</p>
                       <p className="text-[9px] text-muted font-bold uppercase">Confirmado</p>
                    </td>
                    <td className="px-8 py-6">
                       <p className="text-xs font-medium text-muted">{new Date(seller.created_at).toLocaleDateString()}</p>
                    </td>
                    <td className="px-8 py-6">
                      <span className="bg-[#00E0A6]/10 text-[#008F6A] text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                        Activo
                      </span>
                    </td>
                  </tr>
                );
              })}

              {(!sellers || sellers.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center text-muted italic">
                    No se encontraron vendedores registrados.
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
