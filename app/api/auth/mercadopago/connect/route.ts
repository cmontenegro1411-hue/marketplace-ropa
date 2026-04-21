import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const clientId = process.env.MP_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/mercadopago/callback`;
  
  if (!clientId) {
    return NextResponse.json({ error: 'MP_CLIENT_ID no configurado' }, { status: 500 });
  }

  // URL de Autorización de Mercado Pago para Chile/Perú/etc.
  const authUrl = `https://auth.mercadopago.com.pe/authorization?client_id=${clientId}&response_type=code&platform_id=mp&state=${session.user.id}&redirect_uri=${encodeURIComponent(redirectUri)}`;

  return NextResponse.redirect(authUrl);
}
