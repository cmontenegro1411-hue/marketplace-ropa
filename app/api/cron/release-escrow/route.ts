import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { processEscrowRelease } from '@/lib/orders';

export const dynamic = 'force-dynamic';

/**
 * Endpoint de automatización (Cron Job) para liberar fondos estancados en Escrow.
 * Regla: Si una orden tiene más de 72 horas en estado 'pending', se libera automáticamente.
 */
export async function GET(req: Request) {
  try {
    // 1. Protección de seguridad via CRON_SECRET
    // Esto previene que cualquier usuario gatille la liberación masiva de fondos.
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      console.warn('[Cron Escrow] Intento de acceso no autorizado o CRON_SECRET no configurada.');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Calcular el umbral de tiempo (72 horas atrás)
    const now = new Date();
    const thresholdDate = new Date(now.getTime() - (72 * 60 * 60 * 1000));
    
    console.log(`[Cron Escrow] Ejecutando búsqueda de ítems pendientes creados antes de: ${thresholdDate.toISOString()}`);

    // 3. Consultar ítems que califican para auto-pago
    const { data: itemsToRelease, error: fetchErr } = await supabaseAdmin
      .from('order_items')
      .select('id, created_at')
      .eq('status', 'pending')
      .lt('created_at', thresholdDate.toISOString());

    if (fetchErr) {
      throw new Error(`Error consultando ítems pendientes: ${fetchErr.message}`);
    }

    if (!itemsToRelease || itemsToRelease.length === 0) {
      return NextResponse.json({ 
        message: 'No hay ítems pendientes que cumplan el criterio de 72h.',
        timestamp: now.toISOString()
      });
    }

    console.log(`[Cron Escrow] Se encontraron ${itemsToRelease.length} ítems para liberar.`);

    // 4. Procesar liberaciones secuencialmente
    // Usamos un bucle for-of para evitar sobrecargar la base de datos con promesas paralelas masivas
    const results = [];
    for (const item of itemsToRelease) {
      const result = await processEscrowRelease(item.id);
      results.push({
        id: item.id,
        success: result.success,
        error: result.error || null
      });
    }

    // 5. Reportar resultados
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return NextResponse.json({
      summary: {
        total_found: itemsToRelease.length,
        successful,
        failed
      },
      details: results,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('[Cron Escrow Critical Error]:', error.message);
    return NextResponse.json({ 
      error: 'Error interno del servidor en proceso de cron.',
      details: error.message 
    }, { status: 500 });
  }
}
