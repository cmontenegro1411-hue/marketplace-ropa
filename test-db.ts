import dotenv from 'dotenv';
dotenv.config();
import { supabaseAdmin } from './lib/supabase-admin';

async function inspectShippingData() {
  console.log('--- INICIO DE INSPECCIÓN DE ENVÍOS ---');
  try {
    // 1. Obtener los últimos 3 productos
    const { data: products, error: pError } = await supabaseAdmin
      .from('products')
      .select('id, title, seller_id, status')
      .order('created_at', { ascending: false })
      .limit(3);

    if (pError) throw pError;
    if (!products || products.length === 0) {
      console.log('No se encontraron productos.');
      return;
    }

    console.log(`Analizando ${products.length} productos recientes...`);

    for (const p of products) {
      console.log(`\nProducto: "${p.title}" (ID: ${p.id})`);
      console.log(`Estado: ${p.status}`);
      console.log(`Seller ID: ${p.seller_id}`);

      // 2. Obtener data del vendedor
      const { data: seller, error: sError } = await supabaseAdmin
        .from('users')
        .select('id, name, email, ubigeo_code, shipping_rates')
        .eq('id', p.seller_id)
        .single();

      if (sError) {
        console.log(`Error al obtener vendedor ${p.seller_id}:`, sError.message);
        continue;
      }

      console.log(`Vendedor: ${seller.name} (${seller.email})`);
      console.log(`Ubigeo Code: "${seller.ubigeo_code}"`);
      console.log(`Shipping Rates:`, JSON.stringify(seller.shipping_rates, null, 2));

      // 3. Simular cálculo para un ubigeo de prueba (Lima/Lima/Miraflores: 150122)
      const testBuyerUbigeo = '150122';
      const sellerUbigeo = seller.ubigeo_code?.toString().trim().padStart(6, '0');
      const buyerUbigeo = testBuyerUbigeo.padStart(6, '0');
      const rates = seller.shipping_rates as any;

      console.log(`\n--- Simulación de Cálculo (Comprador en Miraflores 150122) ---`);
      if (!sellerUbigeo) {
        console.log('RESULTADO: Vendedor SIN UBIGEO. Debería aplicar tarifa nacional por defecto.');
      } else if (sellerUbigeo === buyerUbigeo) {
        console.log('RESULTADO: Local (Mismo Distrito). Tarifa:', rates?.local ?? 10);
      } else if (sellerUbigeo.substring(0, 2) === buyerUbigeo.substring(0, 2)) {
        console.log('RESULTADO: Regional (Mismo Departamento). Tarifa:', rates?.regional ?? 15);
      } else {
        console.log('RESULTADO: Nacional (Diferente Departamento). Tarifa:', rates?.national ?? 25);
      }
    }

  } catch (e: any) {
    console.error('Error durante la inspección:', e.message);
  }
  console.log('\n--- FIN DE INSPECCIÓN ---');
}

inspectShippingData();
