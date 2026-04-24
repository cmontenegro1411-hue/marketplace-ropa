import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function seedPlatformRevenue() {
  console.log("🚀 Generando transacciones de prueba para platform_revenue...");

  // 1. Obtener un usuario para asociar las transacciones
  const { data: users } = await supabaseAdmin.from('users').select('id').limit(1);
  const userId = users?.[0]?.id;

  if (!userId) {
    console.error("❌ No se encontró ningún usuario en la base de datos.");
    return;
  }

  const transactions = [
    {
      amount: 15.50,
      type: 'sales_commission',
      user_id: userId,
      reference_id: 'mock_order_001',
      metadata: { product: 'Vestido Vintage', price: 155.00 }
    },
    {
      amount: 9.90,
      type: 'credit_purchase',
      user_id: userId,
      reference_id: 'mock_payment_123',
      metadata: { package: 'pkg_5', credits: 5 }
    },
    {
      amount: 24.90,
      type: 'credit_purchase',
      user_id: userId,
      reference_id: 'mock_payment_456',
      metadata: { package: 'pkg_15', credits: 15 }
    },
    {
      amount: 8.90,
      type: 'sales_commission',
      user_id: userId,
      reference_id: 'mock_order_002',
      metadata: { product: 'Blusa Seda', price: 89.00 }
    }
  ];

  const { error } = await supabaseAdmin.from('platform_revenue').insert(transactions);

  if (error) {
    console.error("❌ Error insertando datos:", error.message);
  } else {
    console.log("✅ Datos de prueba insertados con éxito. Revisa el Dashboard de Comisiones.");
  }
}

seedPlatformRevenue();
