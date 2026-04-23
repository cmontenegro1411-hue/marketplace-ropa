import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listAllOrdersAndTxs() {
    console.log('--- AUDITORÍA DE ÓRDENES ---');
    const { data: orders } = await supabase.from('orders').select('id, items, total_amount, created_at');
    console.log(`Total órdenes: ${orders?.length}`);
    orders?.forEach(o => {
        const itemTitles = (o.items as any[])?.map(i => i.title).join(', ');
        console.log(`- ID: ${o.id} | Items: ${itemTitles} | Total: ${o.total_amount}`);
    });

    console.log('\n--- AUDITORÍA DE TRANSACCIONES SIN ORDEN ---');
    const { data: txs } = await supabase
        .from('wallet_transactions')
        .select('*')
        .is('order_id', null)
        .eq('type', 'capture');

    console.log(`Transacciones de tipo "capture" sin order_id: ${txs?.length}`);
    for (const t of txs || []) {
        // Buscar el producto para saber qué se vendió
        const { data: product } = await supabase
            .from('products')
            .select('title, price')
            .eq('id', t.order_item_id)
            .single();

        console.log(`- TX ID: ${t.id} | Product: ${product?.title} | Amount: ${t.amount} | ItemID: ${t.order_item_id}`);
    }
}

listAllOrdersAndTxs();
