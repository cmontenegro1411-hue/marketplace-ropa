import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { MercadoPagoConfig, Preference } from 'mercadopago';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    // 💡 REMOVEMOS el bloqueo de auth porque permitiremos el Guest Checkout para compradores.
    
    const { items, buyerInfo } = await req.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'El carrito está vacío' }, { status: 400 });
    }

    const productIds = items.map((i: any) => i.id);
    const { data: products, error: dbError } = await supabaseAdmin
      .from('products')
      // Removed strict !inner to prevent failing entirely if seller user is not explicitly joined
      // Only select users(*) without pointing to non-existent OAuth columns for MVP
      .select('*, users(*)')
      .in('id', productIds);

    if (dbError) console.error("DB Error on preference generation:", dbError);

    if (!products || products.length === 0) {
      return NextResponse.json({ error: 'Productos no encontrados en la Base de Datos.' }, { status: 404 });
    }

    // Ya no exigimos que el vendedor tenga mp_user_id porque en este MVP Escrow, 
    // todo el pago se va hacia el MP_ACCESS_TOKEN de la plataforma principal (Antigravity).
    const mainSeller = products[0].users;
    if (!mainSeller) {
      console.warn('Producto huérfano (sin vendedor asignado en BD)');
    }

    // 2. Calcular Comisiones (Escrow Setup)
    // - S/ 2 fixed fee if ai_usage_type is 'on_demand'
    // - 5% platform fee (ejemplo)
    let totalMarketplaceFee = 0;
    const preferenceItems = products.map(p => {
      let itemFee = p.price * 0.10; // 10% plataforma base
      if (p.ai_usage_type === 'on_demand') {
        itemFee += 2; // S/ 2 por uso de IA
      }
      totalMarketplaceFee += itemFee;

      return {
        id: p.id,
        title: p.title,
        unit_price: p.price,
        quantity: 1,
        currency_id: 'PEN'
      };
    });

    const client = new MercadoPagoConfig({ 
      accessToken: process.env.MP_ACCESS_TOKEN || '' 
    });
    
    const preference = new Preference(client);

    const result = await preference.create({
      body: {
        items: preferenceItems,
        payer: {
          email: buyerInfo.email,
          name: buyerInfo.name,
        },
        // Modo Escrow: El pago llega 100% a la plataforma (Antigravity)
        // La plataforma retendrá el dinero hasta la confirmación.
        notification_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/mercadopago`,
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/success`,
          failure: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/error`,
          pending: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/pending`,
        },
        auto_return: 'approved',
        external_reference: JSON.stringify({
          userId: session?.user?.id || 'guest',
          buyerEmail: buyerInfo.email,
          buyerName: buyerInfo.name,
          buyerPhone: buyerInfo.buyer_phone,
          productIds: productIds,
          type: 'clothing_escrow'
        }),
      }
    });

    return NextResponse.json({ id: result.id, init_point: result.init_point });

  } catch (error: any) {
    console.error('[Preference Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
