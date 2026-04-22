import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { addCredits, getOrCreateCredits } from '@/lib/credits';

export async function POST(_req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const isBypassEnabled = process.env.ALLOW_DEBUG_BYPASS === 'true';
    if (!isBypassEnabled) {
      return NextResponse.json({ error: 'Operación no permitida en este entorno' }, { status: 403 });
    }

    // Simulación: Añadir 2 créditos al usuario
    await addCredits(session.user.id, 2);
    
    const updatedCredits = await getOrCreateCredits(session.user.id);

    return NextResponse.json({ 
      success: true, 
      message: 'Compra simulada exitosa. Se añadieron 2 créditos.',
      credits: updatedCredits 
    });
  } catch (error: any) {
    console.error('[buy-credits] Error:', error);
    return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 });
  }
}
