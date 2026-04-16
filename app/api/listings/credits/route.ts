import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getOrCreateCredits } from '@/lib/credits';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const credits = await getOrCreateCredits(session.user.id);
    return NextResponse.json(credits);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
