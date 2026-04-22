import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/signup?error=mp_denied`);
  }

  try {
    // Intercambiar código por Access Token
    const res = await fetch('https://api.mercadopago.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}` // Token de la plataforma
      },
      body: JSON.stringify({
        client_id: process.env.MP_CLIENT_ID,
        client_secret: process.env.MP_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/mercadopago/callback`
      })
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('[MP_OAUTH] Error:', data);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/signup?error=mp_auth_failed`);
    }

    // Redirigir de vuelta al registro con los datos necesarios (en una app real usaríamos una sesión segura)
    // Para simplificar y que el usuario termine su registro:
    const params = new URLSearchParams({
      mp_user_id: data.user_id,
      mp_access_token: data.access_token,
      mp_public_key: data.public_key,
      linked: 'true'
    });

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/signup?${params.toString()}`);

  } catch (error) {
    console.error('[MP_OAUTH] Error inesperado:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/signup?error=server_error`);
  }
}
