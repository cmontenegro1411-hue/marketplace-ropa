import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkProductStatus() {
    console.log('--- REVISANDO ESTADOS DE PRODUCTOS VENDIDOS ---');
    
    const { data: sold } = await supabase
        .from('products')
        .select('*')
        .eq('status', 'sold');

    for (const p of sold || []) {
        console.log(`\nProducto: ${p.title} (${p.id})`);
        console.log(`Vendedor ID: ${p.seller_id}`);
        console.log(`Comprador: ${p.buyer_name} (${p.buyer_email})`);
        
        // Buscar orden
        const { data: order } = await supabase
            .from('orders')
            .select('id')
            .contains('items', [{ brand: p.brand, title: p.title }]);

        console.log(`Orden vinculada (por contenido): ${order?.[0]?.id || 'NINGUNA'}`);
    }
}

checkProductStatus();
