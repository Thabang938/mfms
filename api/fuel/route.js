import { supabase } from '@/lib/supabaseClient';

export async function GET() {
  const { data, error } = await supabase.from('fuel_logs').select('*');
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function POST(req) {
  const body = await req.json();
  const { data, error } = await supabase.from('fuel_logs').insert([body]);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function PUT(req) {
  const body = await req.json();
  const { id, ...updates } = body;
  const { data, error } = await supabase.from('fuel_logs').update(updates).eq('id', id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function DELETE(req) {
  const body = await req.json();
  const { id } = body;
  const { data, error } = await supabase.from('fuel_logs').delete().eq('id', id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}