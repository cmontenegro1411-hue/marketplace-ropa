import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { syncSellerToNotion } from '@/lib/notion';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const paymentId = searchParams.get('payment_id');
    const pendingId = searchParams.get('pending_id');

    if (status !== 'success' && status !== 'approved') {
      return NextResponse.redirect(new URL('/signup?error=payment_failed', req.url));
    }

    if (!pendingId) {
      return NextResponse.redirect(new URL('/signup?error=missing_pending_id', req.url));
    }

    // 1. Obtener registro temporal
    const { data: pendingReg, error: pendingErr } = await supabase
      .from('pending_registrations')
      .select('*')
      .eq('id', pendingId)
      .single();

    if (pendingErr || !pendingReg) {
      return NextResponse.redirect(new URL('/signup?error=invalid_registration', req.url));
    }

    if (pendingReg.status === 'completed') {
      // Ya fue procesado
      return NextResponse.redirect(new URL('/login?registered=true', req.url));
    }

    // 2. Insertar en Supabase (tabla publica 'users')
    const { data: newUser, error: userErr } = await supabase
      .from('users')
      .insert([
        { 
          email: pendingReg.email, 
          password_hash: pendingReg.password_hash, 
          name: pendingReg.name, 
          role: 'seller'
        }
      ])
      .select()
      .single();

    if (userErr) {
      console.error('[SignupCallback] User Insert Error:', userErr);
      return NextResponse.redirect(new URL('/signup?error=account_creation_failed', req.url));
    }

    // 3. Insertar el paquete de Vendedor en `listing_credits`
    const planLimits = {
      starter: { limit: 50, ai: 10 },
      pro: { limit: 200, ai: 50 },
      unlimited: { limit: 9999, ai: 200 },
    };
    const selectedPlan = planLimits[pendingReg.plan as keyof typeof planLimits] || planLimits.starter;

    await supabase.from('listing_credits').insert({
      user_id: newUser.id,
      plan: pendingReg.plan,
      credits_total: selectedPlan.ai,
      credits_used: 0,
      product_limit: selectedPlan.limit
    });

    // 4. Marcar como completado
    await supabase.from('pending_registrations').update({ status: 'completed' }).eq('id', pendingId);

    // 5. Sincronizar con CRM en Notion (fire-and-forget)
    syncSellerToNotion({
      userId: newUser.id,
      email: newUser.email,
      name: newUser.name || newUser.email.split('@')[0],
      source: 'Web Signup Checkout'
    }).catch(err => {
      console.error('[SignupCallback] Error en promesa de sync Notion:', err);
    });

    // Éxito: Redirigir al login
    return NextResponse.redirect(new URL('/login?registered=true', req.url));

  } catch (error: any) {
    console.error('[SignupCallback] Error:', error.message);
    return NextResponse.redirect(new URL('/signup?error=server_error', req.url));
  }
}
