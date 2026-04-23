import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function findTomyCamisaBeige() {
    console.log('Buscando productos "Tomy" de Miguel Rios...');
    
    // Primero buscar al usuario Miguel Rios para obtener su ID
    const { data: users, error: userError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .ilike('full_name', '%Miguel%');

    if (userError || !users) {
        console.error('Error buscando usuario:', userError);
        return;
    }

    const miguel = users.find(u => u.full_name?.includes('Miguel Rios'));
    if (!miguel) {
        console.error('No se encontró a Miguel Rios');
        return;
    }

    console.log(`ID de Miguel: ${miguel.id}`);

    // Buscar productos de este usuario que coincidan con "camisa"
    const { data: products, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', miguel.id)
        .ilike('title', '%camisa%');

    if (productError) {
        console.error('Error buscando productos:', productError);
        return;
    }

    console.log('\nProductos encontrados:');
    products?.forEach(p => {
        console.log(`- ID: ${p.id} | Titulo: ${p.title} | Status: ${p.status} | Price: ${p.price}`);
    });

    // Ahora buscar transacciones de billetera para estos productos
    console.log('\nBuscando transacciones de billetera para estos productos...');
    for (const p of products || []) {
        const { data: txs, error: txError } = await supabase
            .from('wallet_transactions')
            .select('*')
            .eq('order_item_id', p.id);

        if (txError) {
            console.error(`Error buscando transacciones para ${p.id}:`, txError);
            continue;
        }

        if (txs && txs.length > 0) {
            console.log(`\nTransacciones para "${p.title}" (${p.id}):`);
            txs.forEach(t => {
                console.log(`  - Type: ${t.type} | Amount: ${t.amount} | Date: ${t.created_at} | OrderID: ${t.order_id}`);
            });
        }
    }
}

findTomyCamisaBeige();
