import { NextResponse } from 'next/server';
import supabase from '@/lib/db';

// GET /api/clientes/[id]
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: cliente, error } = await supabase
    .from('clientes')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !cliente) return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
  return NextResponse.json(cliente);
}

// PUT /api/clientes/[id]
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  const { data: cliente, error } = await supabase
    .from('clientes')
    .update({
      nombre: body.nombre,
      cedula: body.cedula || null,
      telefono: body.telefono || '',
      correo: body.correo || '',
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.message?.includes('unique') || error.code === '23505') {
      return NextResponse.json({ error: 'Ya existe un cliente con esa cédula' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 });
  }

  return NextResponse.json(cliente);
}

// DELETE /api/clientes/[id]
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  await supabase.from('clientes').delete().eq('id', id);
  return NextResponse.json({ ok: true });
}
