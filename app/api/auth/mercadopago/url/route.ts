import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.MP_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/mercadopago/callback`;
  
  if (!clientId) {
    return NextResponse.json({ error: 'MP_CLIENT_ID no configurado' }, { status: 500 });
  }

  // URL para Mercado Pago Connect (OAuth)
  const url = `https://auth.mercadopago.com.pe/authorization?client_id=${clientId}&response_type=code&platform_id=mp&redirect_uri=${encodeURIComponent(redirectUri)}`;

  return NextResponse.json({ url });
}
