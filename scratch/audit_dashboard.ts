
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function auditDashboardData() {
  console.log('--- AUDITORÍA DE DATOS DE DASHBOARD ---');

  // 1. Obtener todos los vendedores
  const { data: sellers } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('full_name', ['Miguel Rios', 'Jennyfer Garay', 'Martin Morales']);

  for (const seller of sellers || []) {
    console.log(`\nVendedor: ${seller.full_name} (${seller.id})`);

    // Órdenes asociadas a este vendedor (vía productos)
    const { data: items } = await supabase
      .from('order_items')
      .select(`
        id,
        price,
        status,
        order_id,
        order:orders(payment_status, buyer_name),
        product:products(seller_id)
      `)
      .eq('product.seller_id', seller.id);

    const validItems = items?.filter(item => item.product?.seller_id === seller.id) || [];
    
    console.log(`- Total Items en órdenes: ${validItems.length}`);
    const completedItems = validItems.filter(i => i.order?.payment_status === 'completed');
    const totalVentas = completedItems.reduce((sum, i) => sum + (i.price || 0), 0);
    
    console.log(`- Ventas 'completed' calculadas: S/ ${totalVentas}`);
    completedItems.forEach(i => {
        console.log(`  > Orden ${i.order_id}: S/ ${i.price} - Comprador: ${i.order?.buyer_name} - Status Item: ${i.status}`);
    });

    // Revisar wallet_transactions
    const { data: wallet } = await supabase
      .from('profiles')
      .select('balance_available, balance_pending')
      .eq('id', seller.id)
      .single();
    
    console.log(`- Wallet DB: Pendiente S/ ${wallet?.balance_pending}, Disponible S/ ${wallet?.balance_available}`);
  }

  // 2. Buscar ventas sin compras (huérfanas)
  console.log('\n--- BUSCANDO REGISTROS DE VENTAS INCONSISTENTES ---');
  const { data: allItems } = await supabase
    .from('order_items')
    .select('id, order_id, order:orders(id)');
  
  const huerfanos = allItems?.filter(i => !i.order) || [];
  console.log(`- Items sin orden padre: ${huerfanos.length}`);
  
  const { data: transactions } = await supabase
    .from('wallet_transactions')
    .select('id, amount, type, description, seller_id, order_id')
    .order('created_at', { ascending: false });

  console.log(`- Total transacciones en historial: ${transactions?.length || 0}`);
}

auditDashboardData();
