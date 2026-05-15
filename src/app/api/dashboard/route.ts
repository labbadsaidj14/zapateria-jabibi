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

  return NextResponse.json({
    totalClientes: totalClientes || 0,
    totalTickets: totalTickets || 0,
    ticketsPendientes: ticketsPendientes || 0,
    ticketsListos: ticketsListos || 0,
    materialesBajos,
    ticketsRecientes: ticketsConCliente,
    alertasStock,
  });
}
