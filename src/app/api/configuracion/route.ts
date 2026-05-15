import { NextResponse } from 'next/server';
import supabase from '@/lib/db';

// GET /api/configuracion
export async function GET() {
  const { data: config } = await supabase
    .from('configuracion')
    .select('*')
    .eq('id', 1)
    .single();

  return NextResponse.json(config);
}

// PUT /api/configuracion
export async function PUT(request: Request) {
  const body = await request.json();

  await supabase
    .from('configuracion')
    .update({
      nombre_negocio: body.nombre_negocio || 'Zapatería Jabibi',
      telefono: body.telefono || '',
      direccion: body.direccion || '',
      prefijo_ticket: body.prefijo_ticket || 'JAB-',
      visitas_frecuente: body.visitas_frecuente || 5,
    })
    .eq('id', 1);

  const { data: config } = await supabase
    .from('configuracion')
    .select('*')
    .eq('id', 1)
    .single();

  return NextResponse.json(config);
}
