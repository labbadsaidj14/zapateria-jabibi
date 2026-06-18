import { NextResponse } from 'next/server';
import supabase from '@/lib/db';

// POST /api/auth — Login with PIN
export async function POST(request: Request) {
  const body = await request.json();
  const { pin } = body;

  if (!pin) {
    return NextResponse.json({ error: 'PIN requerido' }, { status: 400 });
  }

  const { data: usuario, error } = await supabase
    .from('usuarios')
    .select('id, nombre, rol, activo')
    .eq('pin', pin)
    .eq('activo', true)
    .single();

  if (error || !usuario) {
    return NextResponse.json({ error: 'PIN inválido' }, { status: 401 });
  }

  return NextResponse.json(usuario);
}
