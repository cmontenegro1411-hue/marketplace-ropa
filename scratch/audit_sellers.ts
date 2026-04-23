import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function findMiguelProfiles() {
    console.log('Buscando todos los perfiles...');
    const { data: profiles } = await supabase.from('profiles').select('*');
    
    console.log(`Total perfiles: ${profiles?.length}`);
    profiles?.forEach(p => {
        if (p.full_name?.toLowerCase().includes('miguel') || p.full_name?.toLowerCase().includes('rios')) {
            console.log(`[MATCH] ID: ${p.id} | Name: ${p.full_name} | Role: ${p.role}`);
        }
    });

    console.log('\nAuditando todos los "sold" de nuevo para cruzar con vendedores...');
    const { data: sold } = await supabase.from('products').select('*').eq('status', 'sold');
    for (const p of sold || []) {
        const profile = profiles?.find(pr => pr.id === p.seller_id);
        console.log(`- Item: ${p.title} | Seller: ${profile?.full_name || 'Desconocido'} (${p.seller_id})`);
    }
}

findMiguelProfiles();
