import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSpecificProduct() {
    console.log('Buscando el producto exacto por ID...');
    
    const { data: product } = await supabase
        .from('products')
        .select('*')
        .eq('id', '26e54c45-a6dd-4aca-8eaf-014bf0da912a')
        .single();

    if (product) {
        console.log('PRODUCTO ENCONTRADO:');
        console.log(JSON.stringify(product, null, 2));
    } else {
        console.log('Producto no encontrado en la tabla "products".');
    }
}

checkSpecificProduct();
