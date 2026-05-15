import { NextResponse } from 'next/server';
import supabase from '@/lib/db';

interface TicketServicio {
  descripcion: string;
  precio: number;
}

interface TicketMaterial {
  material_id: number;
  cantidad: number;
}

// GET /api/tickets?q=busqueda&estado=Recibido
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  const estado = searchParams.get('estado') || '';

  let query = supabase
    .from('tickets')
    .select('*, clientes(nombre, cedula)')
    .order('id', { ascending: false });

  if (estado) {
    query = query.eq('estado', estado);
  }

  const { data: tickets, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Map and filter for search
  let result = (tickets || []).map(t => ({
    ...t,
    cliente_nombre: t.clientes?.nombre || null,
    cliente_cedula: t.clientes?.cedula || null,
    clientes: undefined,
  }));

  if (q) {
    const qLower = q.toLowerCase();
    result = result.filter(t =>
      t.numero?.toLowerCase().includes(qLower) ||
      t.cliente_nombre?.toLowerCase().includes(qLower) ||
      t.cliente_cedula?.toLowerCase().includes(qLower)
    );
  }

  return NextResponse.json(result);
}

// POST /api/tickets
export async function POST(request: Request) {
  const body = await request.json();

  // Generate unique ticket number using RPC or manual increment
  // First get and increment the counter
  const { data: counter } = await supabase
    .from('contador_tickets')
    .select('ultimo_numero')
    .eq('id', 1)
    .single();

  const nuevoNumero = (counter?.ultimo_numero || 0) + 1;

  await supabase
    .from('contador_tickets')
    .update({ ultimo_numero: nuevoNumero })
    .eq('id', 1);

  // Get prefix from config
  const { data: config } = await supabase
    .from('configuracion')
    .select('prefijo_ticket')
    .eq('id', 1)
    .single();

  const prefijo = config?.prefijo_ticket || 'JAB-';
  const numero = `${prefijo}${String(nuevoNumero).padStart(5, '0')}`;

  // Insert ticket
  const { data: ticket, error: ticketError } = await supabase
    .from('tickets')
    .insert({
      numero,
      cliente_id: body.cliente_id,
      responsable: body.responsable || '',
      descripcion_zapato: body.descripcion_zapato || '',
      descripcion_trabajo: body.descripcion_trabajo || '',
      estado: body.estado || 'Recibido',
      fecha_entrega: body.fecha_entrega || '',
      descuento: body.descuento || 0,
      total: body.total || 0,
      abono_inicial: body.abono_inicial || 0,
      notas: body.notas || '',
    })
    .select()
    .single();

  if (ticketError) return NextResponse.json({ error: ticketError.message }, { status: 500 });

  const ticketId = ticket.id;

  // Insert services
  if (body.servicios && Array.isArray(body.servicios)) {
    const serviciosData = (body.servicios as TicketServicio[])
      .filter(s => s.descripcion)
      .map(s => ({
        ticket_id: ticketId,
        descripcion: s.descripcion,
        precio: s.precio || 0,
      }));

    if (serviciosData.length > 0) {
      await supabase.from('ticket_servicios').insert(serviciosData);
    }
  }

  // Insert materials used and discount from inventory
  if (body.materiales && Array.isArray(body.materiales)) {
    for (const m of body.materiales as TicketMaterial[]) {
      // Get material cost
      const { data: material } = await supabase
        .from('materiales')
        .select('costo_unitario, cantidad')
        .eq('id', m.material_id)
        .single();

      const subtotal = (material?.costo_unitario || 0) * m.cantidad;

      await supabase.from('ticket_materiales').insert({
        ticket_id: ticketId,
        material_id: m.material_id,
        cantidad: m.cantidad,
        subtotal,
      });

      // Discount from inventory
      if (material) {
        await supabase
          .from('materiales')
          .update({ cantidad: Math.max(0, (material.cantidad || 0) - m.cantidad) })
          .eq('id', m.material_id);
      }
    }
  }

  // Increment client visit count
  if (body.cliente_id) {
    const { data: configVisitas } = await supabase
      .from('configuracion')
      .select('visitas_frecuente')
      .eq('id', 1)
      .single();

    const { data: cliente } = await supabase
      .from('clientes')
      .select('total_visitas')
      .eq('id', body.cliente_id)
      .single();

    const newVisitas = (cliente?.total_visitas || 0) + 1;
    const esFrecuente = newVisitas >= (configVisitas?.visitas_frecuente || 5) ? 1 : 0;

    await supabase
      .from('clientes')
      .update({ total_visitas: newVisitas, es_frecuente: esFrecuente })
      .eq('id', body.cliente_id);
  }

  // Return full ticket with client info
  const { data: fullTicket } = await supabase
    .from('tickets')
    .select('*, clientes(nombre, cedula)')
    .eq('id', ticketId)
    .single();

  const response = {
    ...fullTicket,
    cliente_nombre: fullTicket?.clientes?.nombre || null,
    cliente_cedula: fullTicket?.clientes?.cedula || null,
    clientes: undefined,
  };

  return NextResponse.json(response, { status: 201 });
}
