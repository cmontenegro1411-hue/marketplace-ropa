import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function findCamisaBeigeAnywhere() {
    console.log('Buscando "Beige" en todos los productos...');
    
    const { data: products } = await supabase
        .from('products')
        .select('*')
        .ilike('title', '%Beige%');

    console.log(`Productos encontrados: ${products?.length}`);
    products?.forEach(p => {
        console.log(`- ID: ${p.id} | Titulo: ${p.title} | Status: ${p.status} | Price: ${p.price} | Seller: ${p.seller_id}`);
    });

    console.log('\nBuscando transacciones que NO tengan order_item_id vinculado...');
    const { data: txs } = await supabase
        .from('wallet_transactions')
        .select('*')
        .is('order_item_id', null);

    console.log(`Transacciones sin ID de item: ${txs?.length}`);
    txs?.forEach(t => {
        console.log(`- ID: ${t.id} | Type: ${t.type} | Amount: ${t.amount} | UserID: ${t.user_id}`);
    });
}

findCamisaBeigeAnywhere();
