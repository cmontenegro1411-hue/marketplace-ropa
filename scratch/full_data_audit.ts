import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAllProducts() {
    console.log('Auditando todos los productos y sus estados...');
    
    const { data: products, error } = await supabase
        .from('products')
        .select('id, title, status, price, seller_id');

    if (error) {
        console.error(error);
        return;
    }

    console.log(`Total productos: ${products?.length}`);
    const sold = products?.filter(p => p.status === 'sold') || [];
    console.log(`Productos marcados como "sold": ${sold.length}`);
    
    sold.forEach(p => {
        console.log(`- [${p.status}] ID: ${p.id} | Titulo: ${p.title} | Precio: ${p.price}`);
    });

    console.log('\nAuditando Billeteras...');
    const { data: walletTxs } = await supabase
        .from('wallet_transactions')
        .select('*');
    
    console.log(`Total transacciones billetera: ${walletTxs?.length}`);
    
    // Buscar cualquier cosa relacionada con "camisa" o "beige" en las transacciones
    console.log('\nBuscando referencias a productos en transacciones...');
    for (const p of products || []) {
        const txs = walletTxs?.filter(t => t.order_item_id === p.id) || [];
        if (txs.length > 0 || p.status === 'sold') {
            console.log(`\nProducto: ${p.title} (${p.id})`);
            console.log(`Status: ${p.status} | Precio: ${p.price}`);
            console.log(`Transacciones (${txs.length}):`);
            txs.forEach(t => {
                console.log(`  - ${t.type} | Amount: ${t.amount} | Date: ${t.created_at} | OrderID: ${t.order_id}`);
            });
            if (txs.length === 0) console.log('  [!] NO TIENE TRANSACCIONES DE BILLETERA');
        }
    }
}

checkAllProducts();
