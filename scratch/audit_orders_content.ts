import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkOrderDescriptions() {
    console.log('Buscando en la tabla orders por el título del item...');
    
    // Encontrar todas las órdenes y revisar sus items internamente
    const { data: orders } = await supabase
        .from('orders')
        .select('*');

    console.log(`Órdenes revisadas: ${orders?.length}`);
    
    let found = false;
    orders?.forEach(o => {
        const items = o.items as any[];
        const match = items.find(i => i.title && i.title.toLowerCase().includes('camisa'));
        if (match) {
            console.log(`[SI] Orden ID: ${o.id} tiene item: ${match.title}`);
            found = true;
        } else {
            // Log de lo que SI hay para referencia
            console.log(`[NO] Orden ID: ${o.id} tiene items: ${items.map(i => i.title).join(', ')}`);
        }
    });

    if (!found) {
        console.log('\nNo se encontró ninguna orden que contenga una "camisa".');
    }
}

checkOrderDescriptions();
