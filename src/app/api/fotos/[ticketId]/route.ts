import { NextResponse } from 'next/server';
import supabase from '@/lib/db';

// GET /api/fotos/[ticketId]
export async function GET(_request: Request, { params }: { params: Promise<{ ticketId: string }> }) {
  const { ticketId } = await params;

  const { data: fotos } = await supabase
    .from('ticket_fotos')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('fecha', { ascending: true });

  return NextResponse.json(fotos || []);
}

// POST /api/fotos/[ticketId]
export async function POST(request: Request, { params }: { params: Promise<{ ticketId: string }> }) {
  const { ticketId } = await params;

  const formData = await request.formData();
  const file = formData.get('foto') as File;

  if (!file) {
    return NextResponse.json({ error: 'No se recibió archivo' }, { status: 400 });
  }

  const ext = file.name.split('.').pop() || 'jpg';
  const filename = `ticket_${ticketId}_${Date.now()}.${ext}`;

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('fotos')
    .upload(filename, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ error: 'Error al subir archivo: ' + uploadError.message }, { status: 500 });
  }

  // Get the public URL
  const { data: publicUrl } = supabase.storage
    .from('fotos')
    .getPublicUrl(filename);

  // Save record in DB
  await supabase.from('ticket_fotos').insert({
    ticket_id: parseInt(ticketId),
    nombre_archivo: file.name,
    ruta: publicUrl.publicUrl,
  });

  const { data: fotos } = await supabase
    .from('ticket_fotos')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('fecha', { ascending: true });

  return NextResponse.json(fotos || [], { status: 201 });
}
