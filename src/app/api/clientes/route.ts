import { NextResponse } from 'next/server';
import supabase from '@/lib/db';

// GET /api/clientes?q=busqueda
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';

  let query = supabase.from('clientes').select('*').order('nombre', { ascending: true });

  if (q) {
    query = query.or(`nombre.ilike.%${q}%,cedula.ilike.%${q}%`);
  }

  const { data: clientes, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(clientes);
}

// POST /api/clientes
export async function POST(request: Request) {
  const body = await request.json();

  const { data: cliente, error } = await supabase
    .from('clientes')
    .insert({
      nombre: body.nombre,
      cedula: body.cedula || null,
      telefono: body.telefono || '',
      correo: body.correo || '',
    })
    .select()
    .single();

  if (error) {
    if (error.message?.includes('unique') || error.code === '23505') {
      return NextResponse.json({ error: 'Ya existe un cliente con esa cédula' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error al crear cliente' }, { status: 500 });
  }

  return NextResponse.json(cliente, { status: 201 });
}
