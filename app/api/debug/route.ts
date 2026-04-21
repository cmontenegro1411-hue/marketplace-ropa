import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('*, users(*)')
    .limit(3);

  return NextResponse.json({ data, error });
}
