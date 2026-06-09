import { NextResponse } from 'next/server';
import { hasSupabaseAdminEnv, jsonError } from '@/lib/apiHelpers';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const cityName = String(searchParams.get('city') || '').trim();
    const venueName = String(searchParams.get('venue') || '').trim();
    const date = String(searchParams.get('date') || todayIsoDate()).trim();

    if (!hasSupabaseAdminEnv()) {
      return NextResponse.json({ ok: true, mode: 'demo-no-db', cities: [], venues: [], matches: [] });
    }

    const supabase = getSupabaseAdmin();

    const [citiesRes, venuesRes] = await Promise.all([
      supabase.from('cities').select('id,name').order('name', { ascending: true }),
      supabase.from('venues').select('id,city_id,name,cities(name)').order('name', { ascending: true }),
    ]);
    if (citiesRes.error) throw citiesRes.error;
    if (venuesRes.error) throw venuesRes.error;

    let query = supabase
      .from('operator_match_queue')
      .select('*')
      .eq('match_date', date)
      .order('match_order', { ascending: true })
      .order('match_id', { ascending: true });

    if (venueName) query = query.eq('venue_name', venueName);

    const matchesRes = await query;
    if (matchesRes.error) throw matchesRes.error;

    const allVenues = (venuesRes.data || []).map((v: any) => ({
      id: v.id,
      city_id: v.city_id,
      city: v.cities?.name || '',
      name: v.name,
    }));

    const matches = (matchesRes.data || [])
      .filter((m: any) => !cityName || m.city_name === cityName)
      .map((m: any) => ({
        id: m.match_id,
        time: m.match_time || 'Saat yok',
        city: m.city_name || cityName || '',
        venue: m.venue_name || venueName || '',
        home: m.home_team_name || 'Ev Sahibi',
        away: m.away_team_name || 'Misafir',
        homeTeamId: m.home_team_id || null,
        awayTeamId: m.away_team_id || null,
        category: m.category_name || '-',
        competition: m.competition_name || 'Resmi Maç',
        competitionType: m.competition_type || 'LEAGUE',
        countsForStandings: m.counts_for_standings ?? true,
        countsForSeasonStats: m.counts_for_season_stats ?? true,
      }));

    return NextResponse.json({
      ok: true,
      cities: citiesRes.data || [],
      venues: allVenues,
      matches,
    });
  } catch (err: any) {
    return jsonError('operator queue failed', 500, err.message || err);
  }
}
