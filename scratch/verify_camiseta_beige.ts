import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkCamisetaBeige() {
    console.log('Inspeccionando producto "Camiseta beige casual para hombre de algodón" (0abc2a66-0454-41fe-b54c-b85ec161957f)...');
    
    // 1. Buscar transacciones de billetera por descripción o monto
    const { data: txs } = await supabase
        .from('wallet_transactions')
        .select('*')
        .or('description.ilike.%Camiseta beige%,amount.eq.40');

    console.log(`Transacciones potenciales encontradas: ${txs?.length}`);
    txs?.forEach(t => {
        console.log(`- ID: ${t.id} | Type: ${t.type} | Amount: ${t.amount} | Date: ${t.created_at} | OrderID: ${t.order_id} | ItemID: ${t.order_item_id}`);
        console.log(`  Desc: ${t.description}`);
    });

    // 2. Buscar en órdenes
    const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .eq('id', '3d0a46ae-4ca9-41a8-8e1f-a24aab1d8dbe')
        .single();

    if (orders) {
        console.log('\nOrden vinculada 3d0a46ae-4ca9-41a8-8e1f-a24aab1d8dbe:');
        console.log(JSON.stringify(orders.items, null, 2));
    }
}

checkCamisetaBeige();
