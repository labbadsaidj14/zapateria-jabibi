import { NextResponse } from 'next/server';
import supabase from '@/lib/db';

// GET /api/dashboard
export async function GET() {
  const { count: totalClientes } = await supabase
    .from('clientes')
    .select('*', { count: 'exact', head: true });

  const { count: totalTickets } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true });

  const { count: ticketsPendientes } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .in('estado', ['Recibido', 'En proceso']);

  const { count: ticketsListos } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('estado', 'Listo');

  // Materials with low stock - need to fetch and filter
  const { data: allMateriales } = await supabase
    .from('materiales')
    .select('*')
    .gt('stock_minimo', 0);

  const alertasStock = (allMateriales || []).filter(m => m.cantidad <= m.stock_minimo);
  const materialesBajos = alertasStock.length;

  const { data: ticketsRecientes } = await supabase
    .from('tickets')
    .select('*, clientes(nombre)')
    .order('id', { ascending: false })
    .limit(5);

  // Map to expected format
  const ticketsConCliente = (ticketsRecientes || []).map(t => ({
    ...t,
    cliente_nombre: t.clientes?.nombre || null,
    clientes: undefined,
  }));

  // Tickets listos para retirar (recordatorios) — with real abono totals
  const { data: ticketsListosData } = await supabase
    .from('tickets')
    .select('*, clientes(nombre, telefono, cedula)')
    .eq('estado', 'Listo')
    .order('id', { ascending: false });

  // Fetch abonos for all "Listo" tickets in one query
  const listosIds = (ticketsListosData || []).map(t => t.id);
  let abonosPorTicket: Record<number, number> = {};
  if (listosIds.length > 0) {
    const { data: todosAbonos } = await supabase
      .from('abonos')
      .select('ticket_id, monto')
      .in('ticket_id', listosIds);
    abonosPorTicket = (todosAbonos || []).reduce((acc, a) => {
      acc[a.ticket_id] = (acc[a.ticket_id] || 0) + (a.monto || 0);
      return acc;
    }, {} as Record<number, number>);
  }

  const recordatorios = (ticketsListosData || []).map(t => {
    const abonoInicial = t.abono_inicial || t.deposito || 0;
    const totalAbonos = abonosPorTicket[t.id] || 0;
    const totalPagado = abonoInicial + totalAbonos;
    const saldoRestante = Math.max(0, (t.total || 0) - totalPagado);
    return {
      id: t.id,
      numero: t.numero,
      descripcion_zapato: t.descripcion_zapato,
      fecha_entrega: t.fecha_entrega,
      fecha_ingreso: t.fecha_ingreso,
      total: t.total,
      totalPagado,
      saldoRestante,
      cliente_nombre: t.clientes?.nombre || null,
      cliente_telefono: t.clientes?.telefono || null,
      cliente_cedula: t.clientes?.cedula || null,
    };
  });

  return NextResponse.json({
    totalClientes: totalClientes || 0,
    totalTickets: totalTickets || 0,
    ticketsPendientes: ticketsPendientes || 0,
    ticketsListos: ticketsListos || 0,
    materialesBajos,
    ticketsRecientes: ticketsConCliente,
    alertasStock,
    recordatorios,
  });
}
