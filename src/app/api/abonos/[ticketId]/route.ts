import { NextResponse } from 'next/server';
import supabase from '@/lib/db';

// GET /api/abonos/[ticketId] — get all abonos for a ticket
export async function GET(_request: Request, { params }: { params: Promise<{ ticketId: string }> }) {
  const { ticketId } = await params;

  const { data: abonos } = await supabase
    .from('abonos')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('fecha', { ascending: true });

  const { data: ticket } = await supabase
    .from('tickets')
    .select('total, abono_inicial')
    .eq('id', ticketId)
    .single();

  const totalAbonos = (abonos || []).reduce((sum, a) => sum + (a.monto || 0), 0);
  const totalPagado = (ticket?.abono_inicial || 0) + totalAbonos;
  const restante = Math.max(0, (ticket?.total || 0) - totalPagado);

  return NextResponse.json({ abonos: abonos || [], totalPagado, restante, total: ticket?.total || 0 });
}

// POST /api/abonos/[ticketId] — register a new abono
export async function POST(request: Request, { params }: { params: Promise<{ ticketId: string }> }) {
  const { ticketId } = await params;
  const body = await request.json();

  if (!body.monto || body.monto <= 0) {
    return NextResponse.json({ error: 'El monto debe ser mayor a 0' }, { status: 400 });
  }

  await supabase.from('abonos').insert({
    ticket_id: parseInt(ticketId),
    monto: body.monto,
    nota: body.nota || '',
  });

  // Recalculate
  const { data: ticket } = await supabase
    .from('tickets')
    .select('total, abono_inicial')
    .eq('id', ticketId)
    .single();

  const { data: abonos } = await supabase
    .from('abonos')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('fecha', { ascending: true });

  const totalAbonos = (abonos || []).reduce((sum, a) => sum + (a.monto || 0), 0);
  const totalPagado = (ticket?.abono_inicial || 0) + totalAbonos;
  const restante = Math.max(0, (ticket?.total || 0) - totalPagado);

  return NextResponse.json({ abonos: abonos || [], totalPagado, restante, total: ticket?.total || 0 }, { status: 201 });
}
