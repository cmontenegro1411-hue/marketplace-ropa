import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkOrderDetails() {
    console.log('Inspeccionando detalles de la orden 8e9c2b87-4079-4cd7-88c2-4b75b4ed326a...');
    
    const { data: order, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', '8e9c2b87-4079-4cd7-88c2-4b75b4ed326a')
        .single();

    if (error) {
        console.error(error);
        return;
    }

    console.log(`\nOrden ID: ${order.id}`);
    console.log(`Monto Total: ${order.total_amount}`);
    console.log(`Items en la orden:`);
    console.log(JSON.stringify(order.items, null, 2));
}

checkOrderDetails();
