import { NextResponse } from 'next/server';
import { getUserId, hasSupabaseAdminEnv, jsonError } from '@/lib/apiHelpers';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

function asInteger(value: unknown, fallback?: number) {
  if (value === null || value === undefined || value === '') return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const matchId = asInteger(body.match_id);
    const teamId = asInteger(body.team_id);
    const playerOutId = asInteger(body.player_out_id);
    const playerInId = asInteger(body.player_in_id);
    const quarter = asInteger(body.quarter, 1) || 1;
    const gameClock = String(body.game_clock || '10:00').slice(0, 10);

    if (!matchId || !teamId) return jsonError('match_id and team_id are required', 400, body);
    if (!playerOutId || !playerInId) return jsonError('player_out_id and player_in_id are required', 400, body);
    if (!hasSupabaseAdminEnv()) return jsonError('Supabase admin environment missing', 500);

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('substitutions')
      .insert({
        match_id: matchId,
        team_id: teamId,
        player_out_id: playerOutId,
        player_in_id: playerInId,
        quarter,
        game_clock: gameClock,
        created_by: getUserId(req),
      })
      .select()
      .single();

    if (error) throw error;

    // Oyuncu sahada mı bilgisini güncelle. Süre ve plus/minus hesapları bu bilgiye dayanacak.
    await supabase
      .from('match_rosters')
      .update({ is_on_court: false })
      .eq('match_id', matchId)
      .eq('team_id', teamId)
      .eq('player_id', playerOutId);

    await supabase
      .from('match_rosters')
      .upsert({
        match_id: matchId,
        team_id: teamId,
        player_id: playerInId,
        is_active: true,
        is_selected: true,
        is_starter: false,
        is_on_court: true,
        operator_side: String(body.operator_side || '').toUpperCase() === 'AWAY' ? 'AWAY' : 'HOME',
      }, { onConflict: 'match_id,player_id' });

    return NextResponse.json({ ok: true, data });
  } catch (err: any) {
    return jsonError('substitution save failed', 500, err?.message || err);
  }
}
