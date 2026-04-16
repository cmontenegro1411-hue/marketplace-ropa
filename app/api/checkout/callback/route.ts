import { NextResponse } from 'next/server';
import { payment } from '@/lib/mercadopago';
import { addCredits } from '@/lib/credits';

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

    try {
      const paymentInfo = await payment.get({ id: payment_id });
      if (paymentInfo.status !== 'approved') {
         return NextResponse.redirect(new URL('/dashboard/credits?error=payment_not_approved', req.url));
      }
    } catch (e: any) {
      console.error('[Callback] MP GET Payment error:', e.message);
    }

    const packages: Record<string, { credits: number }> = {
      'pkg_5': { credits: 5 },
      'pkg_15': { credits: 15 },
      'pkg_50': { credits: 50 },
    };

    const addedCredits = packages[package_id]?.credits || 0;

    if (addedCredits > 0) {
      await addCredits(user_id, addedCredits);
    }

    return NextResponse.redirect(new URL(`/dashboard/credits/success?package=${package_id}&credits=${addedCredits}`, req.url));

  } catch (error: any) {
    console.error('[API Checkout Callback] Error:', error.message);
    return NextResponse.redirect(new URL('/dashboard/credits?error=server', req.url));
  }
}
