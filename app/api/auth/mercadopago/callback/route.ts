import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const userId = searchParams.get('state'); // Obtuvimos esto del 'state' enviado en /connect

  if (!code || !userId) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/profile?error=mp_auth_failed`);
  }

  try {
    const response = await fetch('https://api.mercadopago.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`
      },
      body: new URLSearchParams({
        client_secret: process.env.MP_CLIENT_SECRET || '',
        client_id: process.env.MP_CLIENT_ID || '',
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/mercadopago/callback`,
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[MP Callback] Error exchanging token:', data);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/profile?error=token_exchange_failed`);
    }

    // Guardar tokens en la base de datos
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        mp_access_token: data.access_token,
        mp_refresh_token: data.refresh_token,
        mp_user_id: data.user_id,
        mp_public_key: data.public_key,
        mp_token_expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      console.error('[MP Callback] DB Update Error:', updateError);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/profile?error=db_update_failed`);
    }

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/profile?success=mp_connected`);

  } catch (error: any) {
    console.error('[MP Callback] Fatal Error:', error.message);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/profile?error=server_error`);
  }
}
