import { NextResponse } from 'next/server';
import { getUserId, hasSupabaseAdminEnv, jsonError } from '@/lib/apiHelpers';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

function asInteger(value: unknown, fallback?: number) {
  if (value === null || value === undefined || value === '') return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function cleanRow(row: Record<string, any>) {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(row)) {
    if (v !== undefined && v !== '') out[k] = v;
  }
  return out;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const matchId = asInteger(body.match_id);
    const teamId = asInteger(body.team_id);
    const operatorSide = String(body.operator_side || '').toUpperCase() === 'AWAY' ? 'AWAY' : 'HOME';
    const players = Array.isArray(body.players) ? body.players : [];

    if (!matchId || !teamId) return jsonError('match_id and team_id are required', 400, body);
    if (!hasSupabaseAdminEnv()) return jsonError('Supabase admin environment missing', 500);

    const supabase = getSupabaseAdmin();

    // Eski seçimi pasife al. Böylece aynı takım kadroyu yeniden gönderirse eski oyuncular aktif kalmaz.
    await supabase
      .from('match_rosters')
      .update({ is_active: false, is_selected: false, is_on_court: false })
      .eq('match_id', matchId)
      .eq('team_id', teamId)
      .eq('operator_side', operatorSide);

    const rows = players
      .map((p: any) => {
        const playerId = asInteger(p.player_id);
        if (!playerId) return null;
        return cleanRow({
          match_id: matchId,
          team_id: teamId,
          player_id: playerId,
          jersey_no: asInteger(p.jersey_no),
          is_active: true,
          is_selected: true,
          is_starter: Boolean(p.is_starter),
          is_on_court: Boolean(p.is_on_court || p.is_starter),
          operator_side: operatorSide,
          roster_type: body.roster_type || 'OFFICIAL',
          is_special_match: Boolean(body.is_special_match),
          unavailable_reason: null,
        });
      })
      .filter(Boolean) as Record<string, any>[];

    if (!rows.length) {
      return NextResponse.json({ ok: true, count: 0, warning: 'No valid player_id values. Roster labels were not inserted.' });
    }

    const { data, error } = await supabase
      .from('match_rosters')
      .upsert(rows, { onConflict: 'match_id,player_id' })
      .select();

    if (error) throw error;

    return NextResponse.json({ ok: true, count: data?.length || rows.length, data, reviewed_by: getUserId(req) });
  } catch (err: any) {
    return jsonError('match roster save failed', 500, err?.message || err);
  }
}
