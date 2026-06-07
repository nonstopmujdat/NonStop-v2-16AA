import { NextResponse } from 'next/server';
import { hasSupabaseAdminEnv, jsonError } from '@/lib/apiHelpers';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(_req: Request, { params }: { params: { matchId: string } }) {
  try {
    const matchId = Number(params.matchId);
    if (!hasSupabaseAdminEnv()) return NextResponse.json({ ok: true, mode: 'demo-no-db', match_id: matchId, events: [], report_note: 'Supabase bağlanınca gerçek rapor döner.' });

    const supabaseAdmin = getSupabaseAdmin();
    const { data: match, error: matchError } = await supabaseAdmin.from('matches').select('*').eq('id', matchId).single();
    if (matchError) throw matchError;
    const { data: events, error: eventsError } = await supabaseAdmin.from('match_events').select('*').eq('match_id', matchId).order('id', { ascending: true });
    if (eventsError) throw eventsError;
    return NextResponse.json({ ok: true, match, events, report_note: 'V2.0 Beta rapor endpoint' });
  } catch (err: any) {
    return jsonError('report failed', 500, err.message || err);
  }
}
