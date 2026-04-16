import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import { syncSellerToNotion } from '@/lib/notion';

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json({ message: 'Todos los campos son requeridos' }, { status: 400 });
    }

    // 1. Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 12);

    // 2. Insertar en Supabase (tabla publica 'users')
    const { data: newUser, error } = await supabase
      .from('users')
      .insert([
        { 
          email, 
          password_hash: hashedPassword, 
          name, 
          role: 'seller' // Por defecto son vendedores
        }
      ])
      .select()
      .single();

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({ 
          message: 'Error de Configuración: La tabla de usuarios no existe todavia. Contacte al administrador.' 
        }, { status: 500 });
      }
      if (error.code === '23505') {
        return NextResponse.json({ message: 'Este correo ya esta registrado' }, { status: 400 });
      }
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    // 3. Sincronizar con CRM en Notion (fire-and-forget: no hacer await para no bloquear la UI)
    syncSellerToNotion({
      userId: newUser.id,
      email: newUser.email,
      name: newUser.name || newUser.email.split('@')[0], // Fallback por si acaso
      source: 'Web' // Por defecto
    }).catch(err => {
      console.error('[API Signup] Error en promesa de sync Notion:', err);
    });

    return NextResponse.json({ message: 'Usuario creado', user: { id: newUser.id, email: newUser.email } }, { status: 201 });

  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
