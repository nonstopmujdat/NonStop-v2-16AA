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
    const team_id = Number(form.get('team_id'));
    const season_id = Number(form.get('season_id'));
    const first_name = String(form.get('first_name') || '').trim();
    const last_name = String(form.get('last_name') || '').trim();
    const birth_date_raw = String(form.get('birth_date') || '').trim();
    const jersey_raw = String(form.get('jersey_no') || '').trim();
    const license_raw = String(form.get('license_no') || '').trim();
    const position_raw = String(form.get('position') || '').trim();
    if (!team_id || !season_id || !first_name || !last_name) throw new Error('Eksik alan var.');
    const supabase = getSupabaseAdmin();
    const { data: player, error: playerError } = await supabase.from('players').insert({
      first_name,
      last_name,
      birth_date: birth_date_raw || null,
      jersey_no: jersey_raw ? Number(jersey_raw) : null,
      license_no: license_raw || null,
      position: position_raw || null,
      active: true,
      updated_at: new Date().toISOString(),
    }).select('id').single();
    if (playerError) throw playerError;
    const { error: regError } = await supabase.from('player_team_registrations').insert({
      player_id: player.id,
      team_id,
      season_id,
      start_date: new Date().toISOString().slice(0, 10),
      is_active: true,
    });
    if (regError) throw regError;
    return redirect(req, '/mini-admin/players', { ok: '1' });
  } catch (err: any) {
    return redirect(req, '/mini-admin/players', { error: encodeURIComponent(err.message || 'Oyuncu kaydı başarısız') });
  }
}
