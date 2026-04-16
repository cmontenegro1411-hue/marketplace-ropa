import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import { preference } from '@/lib/mercadopago';

export async function POST(req: Request) {
  try {
    const { email, password, name, plan } = await req.json();

    if (!email || !password || !name || !plan) {
      return NextResponse.json({ message: 'Todos los campos y la selección de plan son requeridos' }, { status: 400 });
    }

    // 1. Validar si el correo ya existe en `users`
    const { data: existingUser } = await supabase.from('users').select('id').eq('email', email).single();
    if (existingUser) {
      return NextResponse.json({ message: 'Este correo ya esta registrado' }, { status: 400 });
    }

    // 2. Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 12);

    // 3. Crear registro temporal (pending_registrations)
    const { data: pendingReg, error: pendingErr } = await supabase
      .from('pending_registrations')
      .insert([{ email, password_hash: hashedPassword, name, plan, status: 'pending' }])
      .select()
      .single();

    if (pendingErr) {
      if (pendingErr.code === '42P01') {
        return NextResponse.json({ 
          message: 'Falta ejecutar la migración pending_registrations.sql en la base de datos.' 
        }, { status: 500 });
      }
      return NextResponse.json({ message: 'Error interno: ' + pendingErr.message }, { status: 500 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    
    const planDetails = {
      starter: { title: 'Paquete Starter', price: 29.00 },
      pro: { title: 'Paquete Pro', price: 69.00 },
      unlimited: { title: 'Paquete Ilimitado', price: 129.00 },
    };
    const packageInfo = planDetails[plan as keyof typeof planDetails] || planDetails.starter;

    // 4. Crear la preferencia de Mercado Pago
    const response = await preference.create({
      body: {
        items: [
          {
            id: `pkg_${plan}`,
            title: `Suscripción Vendedora - ${packageInfo.title}`,
            quantity: 1,
            unit_price: packageInfo.price,
            currency_id: 'PEN',
            description: `Apertura de cuenta vendedora y créditos IA`,
          }
        ],
        payer: {
          email: email,
        },
        back_urls: {
          success: `${baseUrl}/api/auth/signup-callback?status=success&pending_id=${pendingReg.id}`,
          pending: `${baseUrl}/signup?error=payment_pending`,
          failure: `${baseUrl}/signup?error=payment_failed`,
        },
        auto_return: 'approved',
        external_reference: pendingReg.id,
        statement_descriptor: 'MODA CIRCULAR',
      }
    });

    // 5. Devolvemos la URL de pago en vez del "usuario creado"
    return NextResponse.json({ init_point: response.init_point }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
