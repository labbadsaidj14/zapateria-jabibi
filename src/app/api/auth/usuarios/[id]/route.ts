import { NextResponse } from 'next/server';
import supabase from '@/lib/db';

// PUT /api/auth/usuarios/[id]
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  const updates: Record<string, unknown> = {};
  if (body.nombre !== undefined) updates.nombre = body.nombre;
  if (body.rol !== undefined) updates.rol = body.rol;
  if (body.activo !== undefined) updates.activo = body.activo;
  if (body.pin !== undefined) {
    // Check if PIN already exists for another user
    const { data: existing } = await supabase
      .from('usuarios')
      .select('id')
      .eq('pin', body.pin)
      .neq('id', id)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Ese PIN ya está en uso' }, { status: 400 });
    }
    updates.pin = body.pin;
  }

  const { data, error } = await supabase
    .from('usuarios')
    .update(updates)
    .eq('id', id)
    .select('id, nombre, rol, activo, created_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE /api/auth/usuarios/[id]
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  await supabase.from('usuarios').delete().eq('id', id);
  return NextResponse.json({ ok: true });
}
