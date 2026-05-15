import { NextResponse } from 'next/server';
import supabase from '@/lib/db';

// GET /api/tickets/[id]
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Try to find by id or by ticket number
  let ticket;

  // First try by numeric id
  const numId = parseInt(id);
  if (!isNaN(numId)) {
    const { data } = await supabase
      .from('tickets')
      .select('*, clientes(nombre, cedula, telefono)')
      .eq('id', numId)
      .single();
    ticket = data;
  }

  // If not found, try by ticket number
  if (!ticket) {
    const { data } = await supabase
      .from('tickets')
      .select('*, clientes(nombre, cedula, telefono)')
      .eq('numero', id)
      .single();
    ticket = data;
  }

  if (!ticket) return NextResponse.json({ error: 'Ticket no encontrado' }, { status: 404 });

  // Get services
  const { data: servicios } = await supabase
    .from('ticket_servicios')
    .select('*')
    .eq('ticket_id', ticket.id);

  // Get materials with names
  const { data: materialesRaw } = await supabase
    .from('ticket_materiales')
    .select('*, materiales(nombre, unidad)')
    .eq('ticket_id', ticket.id);

  const materiales = (materialesRaw || []).map(m => ({
    ...m,
    material_nombre: m.materiales?.nombre || null,
    unidad: m.materiales?.unidad || null,
    materiales: undefined,
  }));

  // Get config
  const { data: config } = await supabase
    .from('configuracion')
    .select('*')
    .eq('id', 1)
    .single();

  return NextResponse.json({
    ...ticket,
    cliente_nombre: ticket.clientes?.nombre || null,
    cliente_cedula: ticket.clientes?.cedula || null,
    cliente_telefono: ticket.clientes?.telefono || null,
    clientes: undefined,
    servicios: servicios || [],
    materiales,
    config,
  });
}

// PUT /api/tickets/[id] (update estado, etc.)
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  const updates: Record<string, unknown> = {};
  if (body.estado) updates.estado = body.estado;
  if (body.notas !== undefined) updates.notas = body.notas;
  if (body.descripcion_trabajo !== undefined) updates.descripcion_trabajo = body.descripcion_trabajo;
  if (body.fecha_entrega !== undefined) updates.fecha_entrega = body.fecha_entrega;

  if (Object.keys(updates).length > 0) {
    await supabase.from('tickets').update(updates).eq('id', id);
  }

  const { data: ticket } = await supabase
    .from('tickets')
    .select('*, clientes(nombre, cedula)')
    .eq('id', id)
    .single();

  const response = {
    ...ticket,
    cliente_nombre: ticket?.clientes?.nombre || null,
    cliente_cedula: ticket?.clientes?.cedula || null,
    clientes: undefined,
  };

  return NextResponse.json(response);
}

// DELETE /api/tickets/[id]
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  await supabase.from('tickets').delete().eq('id', id);
  return NextResponse.json({ ok: true });
}
