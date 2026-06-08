import { NextResponse } from 'next/server';
import { getSupabaseAdmin, hasSupabaseAdminConfig } from '@/lib/supabaseAdmin';

function redirect(req: Request, path: string, params: Record<string, string>) {
  const url = new URL(path, req.url);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return NextResponse.redirect(url, 303);
}

export async function POST(req: Request) {
  try {
    if (!hasSupabaseAdminConfig()) throw new Error('Supabase servis bağlantısı yok.');
    const form = await req.formData();
    const name = String(form.get('name') || '').trim();
    const club_id = Number(form.get('club_id'));
    const city_id = Number(form.get('city_id'));
    const category_id = Number(form.get('category_id'));
    const season_id = Number(form.get('season_id'));
    if (!name || !club_id || !city_id || !category_id || !season_id) throw new Error('Eksik alan var.');
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('teams').insert({
      name,
      display_name: name,
      club_id,
      city_id,
      category_id,
      season_id,
      is_active: true,
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
    return redirect(req, '/mini-admin/teams', { ok: '1' });
  } catch (err: any) {
    return redirect(req, '/mini-admin/teams', { error: encodeURIComponent(err.message || 'Takım kaydı başarısız') });
  }
}
