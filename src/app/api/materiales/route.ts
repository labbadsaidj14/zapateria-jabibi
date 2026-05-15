import { NextResponse } from 'next/server';
import supabase from '@/lib/db';

// GET /api/materiales
export async function GET() {
  const { data: materiales, error } = await supabase
    .from('materiales')
    .select('*')
    .order('nombre', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(materiales);
}

// POST /api/materiales
export async function POST(request: Request) {
  const body = await request.json();

  const { data: material, error } = await supabase
    .from('materiales')
    .insert({
      nombre: body.nombre,
      cantidad: body.cantidad || 0,
      unidad: body.unidad || 'unidad',
      costo_unitario: body.costo_unitario || 0,
      stock_minimo: body.stock_minimo || 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(material, { status: 201 });
}
