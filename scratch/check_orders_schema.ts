import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkOrdersSchema() {
    console.log('Inspeccionando una orden existente para ver las columnas reales...');
    const { data: order } = await supabase.from('orders').select('*').limit(1).single();
    if (order) {
        console.log('Columnas encontradas:', Object.keys(order));
    }
}

checkOrdersSchema();
