import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { sendEmail } from '@/lib/brevo';

// Cliente admin directo para bypass de RLS en el registro
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json();
    console.log('[SIGNUP] Intentando registro:', { email });

    if (!email || !password || !name) {
      return NextResponse.json({ message: 'Todos los campos son requeridos' }, { status: 400 });
    }

    // 1. Validar si el correo ya existe en `users`
    const { data: existingUsers } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email);
    
    if (existingUsers && existingUsers.length > 0) {
      return NextResponse.json({ message: 'Este correo ya está registrado' }, { status: 400 });
    }

    // 2. Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 12);

    // 3. Crear el usuario en la tabla `users` con datos de MP
    const { data: newUser, error: userErr } = await supabaseAdmin
      .from('users')
      .insert([
        { 
          email, 
          password_hash: hashedPassword, 
          name, 
          role: 'seller'
        }
      ])
      .select()
      .single();

    if (userErr || !newUser) {
      console.error('[SIGNUP] Error al crear usuario:', userErr);
      return NextResponse.json({ message: 'Error al crear la cuenta: ' + userErr?.message }, { status: 500 });
    }

    // 4. Inicializar sus créditos de IA (2 créditos por defecto)
    const { error: creditsErr } = await supabaseAdmin
      .from('listing_credits')
      .insert([
        {
          user_id: newUser.id,
          plan: 'free',
          credits_total: 2,
          credits_used: 0
        }
      ]);

    if (creditsErr) {
      console.error('[SIGNUP] Error al inicializar créditos:', creditsErr);
      // No bloqueamos el registro por esto, pero lo logueamos
    }

    console.log('[SIGNUP] Registro exitoso para:', email);
    
    // 5. Enviar correo de Bienvenida vía Brevo (fire-and-forget para no bloquear UI)
    sendEmail({
      to: [{ email, name }],
      subject: `¡Bienvenid@ a Moda Circular, ${name}! 🎉`,
      htmlContent: `
        <div style="font-family: serif; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0dcd0; border-radius: 20px;">
          <h1 style="color: #4a5d4e; text-align: center;">¡Hola ${name}!</h1>
          <p>Te damos una cálida bienvenida a <strong>Moda Circular</strong>. Tu cuenta de vendedor ha sido creada con éxito.</p>
          <div style="background: #fdfaf6; padding: 20px; border-radius: 15px; margin: 20px 0; text-align: center;">
            <h3 style="margin-top: 0; color: #4a5d4e;">🎁 Tienes un Regalo</h3>
            <p>Te hemos acreditado <strong>2 créditos de IA</strong> totalmente gratis para que pruebes nuestro Generador Mágico de Prendas.</p>
          </div>
          <p>Para empezar a vender, dirígete a tu <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://modacircular.com'}/profile">Clóset (Perfil)</a> y completa tus datos de Mercado Pago.</p>
          <p style="text-align: center; margin-top: 30px; font-size: 12px; color: #999;">El equipo de Moda Circular</p>
        </div>
      `
    }).catch(e => console.error("[SIGNUP] Error enviando correo de bienvenida:", e));


    return NextResponse.json({ 
      success: true, 
      message: 'Cuenta creada con éxito. Ya puedes iniciar sesión.' 
    }, { status: 200 });

  } catch (error: any) {
    console.error('[SIGNUP] ERROR INESPERADO:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
