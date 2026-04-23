import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkOrphanProducts() {
    console.log('Buscando productos "a1305d13-c9ab-4adb-914b-ea6d329a4090" y "bc182507-0b67-4d23-88e0-b880ae4fec3b"...');
    
    const ids = ['a1305d13-c9ab-4adb-914b-ea6d329a4090', 'bc182507-0b67-4d23-88e0-b880ae4fec3b'];
    
    const { data: products } = await supabase
        .from('products')
        .select('*')
        .in('id', ids);

    console.log(`Productos encontrados: ${products?.length}`);
    products?.forEach(p => {
        console.log(`- [${p.status}] ID: ${p.id} | Titulo: ${p.title} | Precio: ${p.price}`);
    });

    console.log('\nAuditando Billeteras con estos IDs específicos...');
    const { data: txs } = await supabase
        .from('wallet_transactions')
        .select('*')
        .in('order_item_id', ids);
    
    txs?.forEach(t => {
        console.log(`- TX: ${t.type} | Amount: ${t.amount} | ItemID: ${t.order_item_id} | OrderID: ${t.order_id}`);
    });
}

checkOrphanProducts();
