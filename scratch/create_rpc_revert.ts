import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function createRPC() {
  console.log('Iniciando creación de RPC revert_escrow_funds...');
  
  const sql = `
    CREATE OR REPLACE FUNCTION revert_escrow_funds(
        target_seller_id UUID,
        payout_to_revert NUMERIC,
        ref_order_item_id UUID,
        tx_description TEXT
    ) RETURNS VOID AS $$
    BEGIN
        -- 1. Restar del balance pendiente del vendedor (sin bajar de 0)
        UPDATE users 
        SET balance_pending = GREATEST(0, balance_pending - payout_to_revert)
        WHERE id = target_seller_id;

        -- 2. Registrar la reversión en wallet_transactions para auditoría
        INSERT INTO wallet_transactions (
            user_id,
            type,
            amount,
            order_item_id,
            description,
            balance_after_pending,
            balance_after_available
        )
        SELECT 
            target_seller_id,
            'refund',
            -payout_to_revert,
            ref_order_item_id,
            tx_description,
            balance_pending,
            balance_available
        FROM users
        WHERE id = target_seller_id;

        -- 3. Marcar el ítem de la orden como cancelado
        UPDATE order_items
        SET status = 'cancelled',
            payout_released = false
        WHERE id = ref_order_item_id;

    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `;

  // Intentamos ejecutarlo. Nota: Requiere que exista el RPC 'execute_sql' previamente.
  // Si no existe, imprimiremos el SQL para el usuario.
  try {
      const { error } = await supabase.rpc('execute_sql', { sql_query: sql });
      if (error) {
          console.log('--- COPIAR ESTE SQL EN EL EDITOR DE SUPABASE ---');
          console.log(sql);
          console.log('--- FIN SQL ---');
          console.error('Error al ejecutar RPC:', error.message);
      } else {
          console.log('✅ RPC creado exitosamente.');
      }
  } catch (e: any) {
      console.log('--- COPIAR ESTE SQL EN EL EDITOR DE SUPABASE ---');
      console.log(sql);
      console.log('--- FIN SQL ---');
      console.error('El entorno no permitió la ejecución directa:', e.message);
  }
}

createRPC();
