import { NextResponse } from 'next/server';
import { preference } from '@/lib/mercadopago';
import { auth } from '@/auth';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { title, unit_price, quantity, packageId } = await req.json();

    if (!title || !unit_price || !quantity || !packageId) {
      return NextResponse.json({ error: 'Faltan datos del paquete' }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    // 1. Create unique idempotency key or identifier
    const orderId = `order_${Date.now()}_${session.user.id}`;

    // 2. Build the preference
    const response = await preference.create({
      body: {
        items: [
          {
            id: packageId,
            title: title as string,
            quantity: Number(quantity),
            unit_price: Number(unit_price),
            currency_id: 'PEN', // Sol Peruano
            description: `Recarga de ${title} en Moda Circular`,
          }
        ],
        payer: {
          email: session.user.email || 'customer@modacircular.pe',
        },
        back_urls: {
          success: `${baseUrl}/api/checkout/callback?status=success&user_id=${session.user.id}&package_id=${packageId}`,
          pending: `${baseUrl}/dashboard/credits?status=pending`,
          failure: `${baseUrl}/dashboard/credits?status=failure`,
        },
        auto_return: 'approved',
        payment_methods: {
          excluded_payment_types: [
            { id: 'ticket' }, // Ocultar PagoEfectivo si se desea (o dejarlo si se quiere efectivo)
          ],
          installments: 1
        },
        metadata: {
          user_id: session.user.id,
          package_id: packageId,
        },
        external_reference: orderId,
        statement_descriptor: 'MODA CIRCULAR',
      }
    });

    // Devuelve el init_point para redirigir al usuario al Checkout Pro
    return NextResponse.json({ init_point: response.init_point });

  } catch (error: any) {
    console.error('[API Checkout] Error:', error.message);
    return NextResponse.json({ error: 'Error procesando el pago' }, { status: 500 });
  }
}
