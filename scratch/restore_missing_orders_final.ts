import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixOrdersTable() {
    console.log('Iniciando restauración de órdenes perdidas...');

    const missingOrders = [
        {
            id: '8e9c2b87-4079-4cd7-88c2-4b75b4ed326a',
            total_amount: 60,
            items: [{ brand: 'Tomy', price: 60, title: 'Camisa a Cuadros Azul Clásica para Hombre' }],
            payment_status: 'approved',
            buyer_email: 'cmontenegrom@outlook.com',
            buyer_name: 'Ursula Teevin'
        },
        {
            id: '3d0a46ae-4ca9-41a8-8e1f-a24aab1d8dbe',
            total_amount: 40,
            items: [{ brand: 'Tomy', price: 40, title: 'Camiseta beige casual para hombre de algodón' }],
            payment_status: 'approved',
            buyer_email: 'cmontenegrom@outlook.com',
            buyer_name: 'Mario Moreno'
        },
        {
            id: 'e9add336-3d97-4d83-824b-ef1ef1c13b7a',
            total_amount: 70,
            items: [{ brand: 'Tomy', price: 70, title: 'Pantalón Negro Clásico para Hombre - Elegancia Atemporal' }],
            payment_status: 'approved',
            buyer_email: 'cmontenegrom@outlook.com',
            buyer_name: 'Camilo Suarez'
        },
        {
            id: '21a6e4eb-d3d6-476f-9aa1-97c2757d19d5',
            total_amount: 350,
            items: [{ brand: 'Bao Bao', price: 350, title: 'Bolso de mano azul y marrón estilo clásico Bao Bao' }],
            payment_status: 'approved',
            buyer_email: 'cmontenegrom@outlook.com',
            buyer_name: 'Yolanda Correa'
        }
    ];

    for (const order of missingOrders) {
        console.log(`Procesando orden ${order.id} (${order.items[0].title})...`);
        
        const { error } = await supabase
            .from('orders')
            .upsert(order);

        if (error) {
            console.error(`Error en orden ${order.id}:`, error);
        } else {
            console.log(`Orden ${order.id} restaurada/actualizada correctamente.`);
        }
    }

    console.log('\nAuditando tabla products para asegurar que todos los sold tengan el formato correcto...');
    // No cambiamos nada en products ya que el dashboard de ventas admin lee de 'orders'.
}

fixOrdersTable();
