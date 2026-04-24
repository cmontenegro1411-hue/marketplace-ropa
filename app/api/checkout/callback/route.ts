import { NextResponse } from 'next/server';
import { payment } from '@/lib/mercadopago';
import { addCredits, migratePlan } from '@/lib/credits';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const payment_id = searchParams.get('payment_id');
    const status = searchParams.get('status');
    const user_id = searchParams.get('user_id');
    const package_id = searchParams.get('package_id');

    if (!payment_id || status !== 'success' || !user_id || !package_id) {
      return NextResponse.redirect(new URL('/dashboard/credits?error=invalid_callback', req.url));
    }

    // 🟢 MODO DEBUG: SI EL ID ES MOCK, SALTAMOS LA VALIDACIÓN DE MP
    if (payment_id?.startsWith('mock_recharge_')) {
      console.log('--- [DEBUG MODE] Accepting Mock Payment for Credits ---');
    } else {
      try {
        const paymentInfo = await payment.get({ id: payment_id! });
        if (paymentInfo.status !== 'approved') {
           return NextResponse.redirect(new URL('/dashboard/credits?error=payment_not_approved', req.url));
        }
      } catch (e: any) {
        console.error('[Callback] MP GET Payment error:', e.message);
        // Si no podemos verificar pero no estamos en modo mock, por seguridad fallamos
        return NextResponse.redirect(new URL('/dashboard/credits?error=verification_failed', req.url));
      }
    }

    // Identificar si es una migración de plan o una recarga simple
    if (package_id.startsWith('plan_')) {
      await migratePlan(user_id, package_id);
      return NextResponse.redirect(new URL(`/profile?migration=success&plan=${package_id}`, req.url));
    }

    const packages: Record<string, { credits: number, price: number }> = {
      'pkg_5': { credits: 5, price: 9.90 },
      'pkg_15': { credits: 15, price: 24.90 },
      'pkg_50': { credits: 50, price: 69.90 },
    };

    const packageInfo = packages[package_id];

    if (packageInfo) {
      await addCredits(user_id, packageInfo.credits);
      
      // 📈 REGISTRAR INGRESO PARA LA PLATAFORMA (Venta de Créditos)
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      await supabaseAdmin.from('platform_revenue').insert({
        amount: packageInfo.price,
        type: 'credit_purchase',
        user_id: user_id,
        reference_id: payment_id,
        metadata: { 
          package_id, 
          credits: packageInfo.credits 
        }
      });
    }

    return NextResponse.redirect(new URL(`/dashboard/credits/success?package=${package_id}&credits=${packageInfo?.credits || 0}`, req.url));

  } catch (error: any) {
    console.error('[API Checkout Callback] Error:', error.message);
    return NextResponse.redirect(new URL('/dashboard/credits?error=server', req.url));
  }
}
