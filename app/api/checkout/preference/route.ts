import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { MercadoPagoConfig, Preference } from 'mercadopago';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    // 💡 REMOVEMOS el bloqueo de auth porque permitiremos el Guest Checkout para compradores.
    
    const { items, buyerInfo, shippingFee } = await req.json();

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

    // 2. Calcular Comisiones y preparar items
    const preferenceItems = products.map(p => {
      return {
        id: p.id,
        title: p.title,
        unit_price: p.price,
        quantity: 1,
        currency_id: 'PEN'
      };
    });

    // Agregar costo de envío si existe
    if (shippingFee && shippingFee > 0) {
      preferenceItems.push({
        id: 'shipping_fee',
        title: 'Costo de Envío (Logística)',
        unit_price: shippingFee,
        quantity: 1,
        currency_id: 'PEN'
      });
    }

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
          shippingFee: shippingFee,
          shippingName: buyerInfo.shipping_name,
          shippingAddress: buyerInfo.shipping_address,
          shippingUbigeo: buyerInfo.shipping_ubigeo,
          shippingDepartment: buyerInfo.shipping_department,
          shippingProvince: buyerInfo.shipping_province,
          shippingDistrict: buyerInfo.shipping_district,
          shippingPhone: buyerInfo.shipping_phone,
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
