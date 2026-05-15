import { NextResponse } from 'next/server';
import supabase from '@/lib/db';

// PUT /api/materiales/[id]
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  const { data: material, error } = await supabase
    .from('materiales')
    .update({
      nombre: body.nombre,
      cantidad: body.cantidad,
      unidad: body.unidad,
      costo_unitario: body.costo_unitario,
      stock_minimo: body.stock_minimo,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(material);
}

// DELETE /api/materiales/[id]
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  await supabase.from('materiales').delete().eq('id', id);
  return NextResponse.json({ ok: true });
}
