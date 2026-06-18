import { NextResponse } from 'next/server';
import supabase from '@/lib/db';

// GET /api/auth/usuarios
export async function GET() {
  const { data, error } = await supabase
    .from('usuarios')
    .select('id, nombre, rol, activo, created_at')
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/auth/usuarios
export async function POST(request: Request) {
  const body = await request.json();

  if (!body.nombre || !body.pin) {
    return NextResponse.json({ error: 'Nombre y PIN son requeridos' }, { status: 400 });
  }

  // Check if PIN already exists
  const { data: existing } = await supabase
    .from('usuarios')
    .select('id')
    .eq('pin', body.pin)
    .single();

  if (existing) {
    return NextResponse.json({ error: 'Ese PIN ya está en uso' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('usuarios')
    .insert({
      nombre: body.nombre,
      pin: body.pin,
      rol: body.rol || 'usuario',
      activo: true,
    })
    .select('id, nombre, rol, activo, created_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
