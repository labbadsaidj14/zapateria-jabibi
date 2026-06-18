import { NextResponse } from 'next/server';
import supabase from '@/lib/db';

interface TicketServicio {
  descripcion: string;
  precio: number;
  articulo_index?: number;
}

interface TicketMaterial {
  material_id: number;
  cantidad: number;
}

interface TicketArticulo {
  nivel1_categoria: string;
  nivel2_tipo: string;
  nivel3_color: string;
  nivel4_material: string;
  nivel5_talla: string;
  descripcion_trabajo: string;
  servicios: TicketServicio[];
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

  // Generate unique ticket number using counter
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

  // Build descripcion_zapato and descripcion_trabajo from articulos for backwards compat
  const articulos: TicketArticulo[] = body.articulos || [];
  const descripcionZapato = articulos.map((a: TicketArticulo) => 
    [a.nivel1_categoria, a.nivel2_tipo, a.nivel3_color, a.nivel4_material, a.nivel5_talla]
      .filter(Boolean).join(' > ')
  ).join(' | ') || body.descripcion_zapato || '';
  
  const descripcionTrabajo = articulos.map((a: TicketArticulo) => a.descripcion_trabajo)
    .filter(Boolean).join(' | ') || body.descripcion_trabajo || '';

  // Insert ticket
  const { data: ticket, error: ticketError } = await supabase
    .from('tickets')
    .insert({
      numero,
      cliente_id: body.cliente_id,
      responsable: body.responsable || '',
      descripcion_zapato: descripcionZapato,
      descripcion_trabajo: descripcionTrabajo,
      estado: body.estado || 'Recibido',
      fecha_ingreso: body.fecha_ingreso || new Date().toISOString(),
      fecha_entrega: body.fecha_entrega || '',
      descuento: 0,
      deposito: body.deposito || 0,
      total: body.total || 0,
      abono_inicial: body.abono_inicial || 0,
      notas: body.notas || '',
    })
    .select()
    .single();

  if (ticketError) return NextResponse.json({ error: ticketError.message }, { status: 500 });

  const ticketId = ticket.id;

  // Insert articulos and their services
  if (articulos.length > 0) {
    for (const articulo of articulos) {
      const { data: articuloData } = await supabase
        .from('ticket_articulos')
        .insert({
          ticket_id: ticketId,
          nivel1_categoria: articulo.nivel1_categoria || '',
          nivel2_tipo: articulo.nivel2_tipo || '',
          nivel3_color: articulo.nivel3_color || '',
          nivel4_material: articulo.nivel4_material || '',
          nivel5_talla: articulo.nivel5_talla || '',
          descripcion_trabajo: articulo.descripcion_trabajo || '',
        })
        .select()
        .single();

      // Insert services for this articulo
      if (articuloData && articulo.servicios && Array.isArray(articulo.servicios)) {
        const serviciosData = articulo.servicios
          .filter((s: TicketServicio) => s.descripcion)
          .map((s: TicketServicio) => ({
            ticket_id: ticketId,
            articulo_id: articuloData.id,
            descripcion: s.descripcion,
            precio: s.precio || 0,
          }));

        if (serviciosData.length > 0) {
          await supabase.from('ticket_servicios').insert(serviciosData);
        }
      }
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
