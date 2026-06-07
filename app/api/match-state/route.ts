import { NextResponse } from 'next/server';
import { hasSupabaseAdminEnv, jsonError } from '@/lib/apiHelpers';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

function asInteger(value: unknown, fallback?: number) {
  if (value === null || value === undefined || value === '') return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function dbStatus(status: string) {
  if (status === 'finished') return 'TAMAMLANDI';
  return 'DEVAM_EDIYOR';
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const matchId = asInteger(body.match_id, 1) || 1;
    const currentQuarter = Math.max(1, asInteger(body.current_quarter, 1) || 1);
    const clockSeconds = Math.max(0, asInteger(body.clock_seconds, 600) || 0);
    const homeScore = Math.max(0, asInteger(body.home_score, 0) || 0);
    const awayScore = Math.max(0, asInteger(body.away_score, 0) || 0);
    const status = String(body.status || 'live');

    if (!hasSupabaseAdminEnv()) {
      return jsonError('Supabase admin environment missing. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Render Environment, then redeploy.', 500, body);
    }

    const update: Record<string, any> = {
      current_quarter: currentQuarter,
      clock_seconds: clockSeconds,
      home_score: homeScore,
      away_score: awayScore,
      status: dbStatus(status),
      notes: JSON.stringify({ nonstop_runtime_status: status, saved_at: new Date().toISOString() })
    };

    if (status === 'finished_pending') {
      update.auto_lock_at = new Date(Date.now() + 60000).toISOString();
    }
    if (status === 'finished') {
      update.finished_at = new Date().toISOString();
      update.locked = true;
      update.locked_at = new Date().toISOString();
    }

    const { data, error } = await getSupabaseAdmin()
      .from('matches')
      .update(update)
      .eq('id', matchId)
      .select('id,current_quarter,clock_seconds,home_score,away_score,status,locked,auto_lock_at,finished_at,locked_at')
      .single();

    if (error) return jsonError('match state update failed', 500, { error, update });
    return NextResponse.json({ ok: true, data });
  } catch (err: any) {
    return jsonError('match state request failed', 500, { error: err?.message || String(err) });
  }
}
