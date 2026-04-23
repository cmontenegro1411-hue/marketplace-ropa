import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkWalletsByProfile() {
    console.log('--- REVISANDO BILLETERAS Y PERFILES ---');
    
    // Obtener todas las transacciones de captura
    const { data: txs } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('type', 'capture');

    for (const t of txs || []) {
        // Intentar obtener el perfil del vendedor (user_id en la transacción)
        const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', t.user_id)
            .single();

        // Intentar obtener el producto
        const { data: product } = await supabase
            .from('products')
            .select('title')
            .eq('id', t.order_item_id)
            .single();

        console.log(`- Vendedor: ${profile?.full_name || 'DESCONOCIDO'} (${t.user_id})`);
        console.log(`  Producto: ${product?.title || 'DESCONOCIDO'} (${t.order_item_id})`);
        console.log(`  Monto: ${t.amount} | Fecha: ${t.created_at}`);
        console.log('------------------------------------------------');
    }
}

checkWalletsByProfile();
