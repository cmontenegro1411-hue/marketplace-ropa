import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listRecentSoldProducts() {
    console.log('Listando productos recientemente vendidos sin orden vinculada...');
    
    // 1. Obtener productos vendidos
    const { data: soldProducts, error: pError } = await supabase
        .from('products')
        .select('id, title, price, seller_id, created_at')
        .eq('status', 'sold')
        .order('created_at', { ascending: false });

    if (pError) {
        console.error('Error:', pError);
        return;
    }

    console.log(`\nSe encontraron ${soldProducts?.length} productos vendidos.\n`);

    for (const p of soldProducts || []) {
        // 2. Verificar si tienen orden
        const { data: orders, error: oError } = await supabase
            .from('orders')
            .select('id')
            .contains('items', [{ id: p.id }]);

        if (oError) {
            console.error(`Error buscando orden para ${p.id}:`, oError);
            continue;
        }

        if (!orders || orders.length === 0) {
            console.log(`[!] PRODUCTO SIN ORDEN:`);
            console.log(`    ID: ${p.id}`);
            console.log(`    Titulo: ${p.title}`);
            console.log(`    Precio: ${p.price}`);
            console.log(`    Vendedor ID: ${p.seller_id}`);

            // 3. Buscar transacciones de billetera para este producto
            const { data: txs, error: txError } = await supabase
                .from('wallet_transactions')
                .select('*')
                .eq('order_item_id', p.id);

            if (txs && txs.length > 0) {
                console.log(`    Transacciones en Billetera:`);
                txs.forEach(t => {
                    console.log(`      - Type: ${t.type} | Amount: ${t.amount} | Date: ${t.created_at} | UserID: ${t.user_id}`);
                });
            } else {
                console.log(`    [!] Sin transacciones en billetera.`);
            }
            console.log('-------------------------------------------');
        }
    }
}

listRecentSoldProducts();
