import { NextResponse } from 'next/server';
import supabase from '@/lib/db';

// GET /api/categorias?nivel=1&padre_id=5
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const nivel = searchParams.get('nivel');
  const padre_id = searchParams.get('padre_id');

  let query = supabase
    .from('categorias_producto')
    .select('*')
    .eq('activo', true)
    .order('orden', { ascending: true });

  if (nivel) {
    query = query.eq('nivel', parseInt(nivel));
  }

  if (padre_id) {
    query = query.eq('padre_id', parseInt(padre_id));
  }

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/categorias
export async function POST(request: Request) {
  const body = await request.json();

  const { data, error } = await supabase
    .from('categorias_producto')
    .insert({
      nivel: body.nivel,
      nombre: body.nombre,
      padre_id: body.padre_id || null,
      orden: body.orden || 0,
      activo: true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
