import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { hasSupabaseAdminEnv, jsonError } from '@/lib/apiHelpers';

type Entity = 'city' | 'venue' | 'club' | 'team' | 'player' | 'admin_request';

function clean(value: FormDataEntryValue | null) {
  const text = String(value || '').trim();
  return text.length ? text : null;
}

function intValue(value: FormDataEntryValue | null) {
  const text = clean(value);
  if (!text) return null;
  const num = Number(text);
  return Number.isFinite(num) ? num : null;
}

export async function GET() {
  try {
    if (!hasSupabaseAdminEnv()) {
      return NextResponse.json({ ok: true, mode: 'demo-no-db', counts: null, lists: {} });
    }

    const supabase = getSupabaseAdmin();
    const [counts, cities, seasons, categories, clubs, teams, requests, venues] = await Promise.all([
      supabase.from('full_admin_counts').select('*').maybeSingle(),
      supabase.from('cities').select('id,name').order('name'),
      supabase.from('seasons').select('id,name,is_active').order('name', { ascending: false }),
      supabase.from('categories').select('id,name,gender').order('name'),
      supabase.from('clubs').select('id,name,city_id').order('name'),
      supabase.from('full_admin_teams').select('*').limit(100),
      supabase.from('full_admin_access_requests').select('*').limit(50),
      supabase.from('venues').select('id,name,city_id').order('name'),
    ]);

    for (const result of [counts, cities, seasons, categories, clubs, teams, requests, venues]) {
      if (result.error) throw result.error;
    }

    return NextResponse.json({
      ok: true,
      counts: counts.data || null,
      lists: {
        cities: cities.data || [],
        seasons: seasons.data || [],
        categories: categories.data || [],
        clubs: clubs.data || [],
        teams: teams.data || [],
        requests: requests.data || [],
        venues: venues.data || [],
      },
    });
  } catch (err: any) {
    return jsonError('full admin data failed', 500, err.message || err);
  }
}

export async function POST(req: Request) {
  try {
    if (!hasSupabaseAdminEnv()) return jsonError('Supabase servis bağlantısı eksik', 500);
    const form = await req.formData();
    const entity = clean(form.get('entity')) as Entity | null;
    const supabase = getSupabaseAdmin();

    if (entity === 'city') {
      const name = clean(form.get('name'));
      if (!name) return jsonError('İl adı zorunlu');
      const { error } = await supabase.from('cities').insert({ name });
      if (error) throw error;
    } else if (entity === 'venue') {
      const city_id = intValue(form.get('city_id'));
      const name = clean(form.get('name'));
      if (!city_id || !name) return jsonError('İl ve salon adı zorunlu');
      const { error } = await supabase.from('venues').insert({
        city_id, name, address: clean(form.get('address')), court_count: intValue(form.get('court_count')) || 1,
      });
      if (error) throw error;
    } else if (entity === 'club') {
      const city_id = intValue(form.get('city_id'));
      const name = clean(form.get('name'));
      if (!city_id || !name) return jsonError('İl ve kulüp adı zorunlu');
      const { error } = await supabase.from('clubs').insert({
        city_id, name, short_name: clean(form.get('short_name')), phone: clean(form.get('phone')), email: clean(form.get('email')),
      });
      if (error) throw error;
    } else if (entity === 'team') {
      const club_id = intValue(form.get('club_id'));
      const category_id = intValue(form.get('category_id'));
      const season_id = intValue(form.get('season_id'));
      const name = clean(form.get('name'));
      if (!club_id || !category_id || !name) return jsonError('Kulüp, kategori ve takım adı zorunlu');
      const clubRes = await supabase.from('clubs').select('city_id').eq('id', club_id).maybeSingle();
      if (clubRes.error) throw clubRes.error;
      const { error } = await supabase.from('teams').insert({
        club_id, category_id, season_id, name, display_name: name, city_id: clubRes.data?.city_id || null, team_code: clean(form.get('team_code')),
      });
      if (error) throw error;
    } else if (entity === 'player') {
      const team_id = intValue(form.get('team_id'));
      const season_id = intValue(form.get('season_id'));
      const first_name = clean(form.get('first_name'));
      const last_name = clean(form.get('last_name'));
      if (!team_id || !first_name || !last_name) return jsonError('Takım, ad ve soyad zorunlu');
      const { data: player, error } = await supabase.from('players').insert({
        first_name, last_name,
        jersey_no: intValue(form.get('jersey_no')),
        birth_date: clean(form.get('birth_date')),
        license_no: clean(form.get('license_no')),
        position: clean(form.get('position')),
        active: true,
      }).select('id').single();
      if (error) throw error;
      const reg = await supabase.from('player_team_registrations').insert({
        player_id: player.id,
        team_id,
        season_id,
        start_date: new Date().toISOString().slice(0, 10),
        is_active: true,
      });
      if (reg.error) throw reg.error;
    } else if (entity === 'admin_request') {
      const full_name = clean(form.get('full_name'));
      const email = clean(form.get('email'));
      if (!full_name || !email) return jsonError('Ad soyad ve e-posta zorunlu');
      const { error } = await supabase.from('admin_access_requests').insert({
        full_name, email,
        phone: clean(form.get('phone')),
        city_id: intValue(form.get('city_id')),
        club_id: intValue(form.get('club_id')),
        requested_role: clean(form.get('requested_role')) || 'CLUB_ADMIN',
        request_note: clean(form.get('request_note')),
      });
      if (error) throw error;
    } else {
      return jsonError('Geçersiz işlem');
    }

    return NextResponse.redirect(new URL('/full-admin?ok=1', req.url), 303);
  } catch (err: any) {
    return jsonError('full admin save failed', 500, err.message || err);
  }
}
