import { NextResponse } from 'next/server';
import { syncSellerToNotion, testNotionConnection } from '@/lib/notion';

export async function GET() {
  const status = await testNotionConnection();
  return NextResponse.json(status, { status: status.ok ? 200 : 503 });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, email, name, source } = body;

    if (!userId || !email || !name) {
      return NextResponse.json({ message: 'Faltan campos requeridos (userId, email, name)' }, { status: 400 });
    }

    const success = await syncSellerToNotion({ userId, email, name, source });

    if (success) {
      return NextResponse.json({ message: 'Usuario sincronizado con Notion exitosamente' }, { status: 200 });
    } else {
      return NextResponse.json({ message: 'Error interno en la integración con Notion' }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
