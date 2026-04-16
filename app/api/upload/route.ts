import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createClient } from '@supabase/supabase-js';

// Service role bypasa RLS — solo se usa server-side
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    // 1. Verificar sesión
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // 2. Leer los archivos del FormData
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No se recibieron archivos' }, { status: 400 });
    }

    const urls: string[] = [];

    // 3. Subir cada archivo con el cliente admin (bypasa RLS)
    for (const file of files) {
      const ext = file.name.split('.').pop() ?? 'jpg';
      const fileName = `${Math.random().toString(36).substring(2)}.${ext}`;
      const filePath = `product-images/${fileName}`;

      const buffer = Buffer.from(await file.arrayBuffer());

      const { error } = await supabaseAdmin.storage
        .from('products')
        .upload(filePath, buffer, { contentType: file.type, upsert: false });

      if (error) {
        console.error('[upload] Error subiendo archivo:', error);
        return NextResponse.json({ error: `Error al subir imagen: ${error.message}` }, { status: 500 });
      }

      const { data: { publicUrl } } = supabaseAdmin.storage
        .from('products')
        .getPublicUrl(filePath);

      urls.push(publicUrl);
    }

    return NextResponse.json({ urls });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno';
    console.error('[upload] Error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
