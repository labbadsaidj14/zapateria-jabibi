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
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const forzar = searchParams.get('forzar') === '1';

  // Check if the client has tickets
  const { data: tickets } = await supabase
    .from('tickets')
    .select('id')
    .eq('cliente_id', id);

  const tieneTickets = tickets && tickets.length > 0;

  if (tieneTickets && !forzar) {
    return NextResponse.json({
      error: `Este cliente tiene ${tickets.length} ticket(s) asociado(s). ¿Deseas eliminarlo junto con todos sus tickets?`,
      tieneTickets: true,
      cantidadTickets: tickets.length,
    }, { status: 409 });
  }

  // If forcing or no tickets, proceed with deletion
  if (tieneTickets) {
    const ticketIds = tickets.map(t => t.id);

    // Delete child records of tickets first
    for (const ticketId of ticketIds) {
      await supabase.from('ticket_servicios').delete().eq('ticket_id', ticketId);
      await supabase.from('ticket_materiales').delete().eq('ticket_id', ticketId);
      await supabase.from('ticket_articulos').delete().eq('ticket_id', ticketId);
      await supabase.from('abonos').delete().eq('ticket_id', ticketId);
    }

    // Delete the tickets
    await supabase.from('tickets').delete().eq('cliente_id', id);
  }

  // Delete the client
  const { error } = await supabase.from('clientes').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: `Error al eliminar: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
