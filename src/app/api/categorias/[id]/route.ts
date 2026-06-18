import { NextResponse } from 'next/server';
import supabase from '@/lib/db';

// PUT /api/categorias/[id]
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  const updates: Record<string, unknown> = {};
  if (body.nombre !== undefined) updates.nombre = body.nombre;
  if (body.orden !== undefined) updates.orden = body.orden;
  if (body.activo !== undefined) updates.activo = body.activo;
  if (body.padre_id !== undefined) updates.padre_id = body.padre_id;

  const { data, error } = await supabase
    .from('categorias_producto')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE /api/categorias/[id]
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  await supabase.from('categorias_producto').delete().eq('id', id);
  return NextResponse.json({ ok: true });
}
