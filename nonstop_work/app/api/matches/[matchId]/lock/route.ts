import { NextResponse } from 'next/server';
import { getUserId, hasSupabaseAdminEnv, jsonError } from '@/lib/apiHelpers';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request, { params }: { params: { matchId: string } }) {
  try {
    const matchId = Number(params.matchId);
    if (!hasSupabaseAdminEnv()) return NextResponse.json({ ok: true, mode: 'demo-no-db', match_id: matchId, locked: true });

    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin.from('matches').update({ locked: true, locked_at: new Date().toISOString() }).eq('id', matchId).select().single();
    if (error) throw error;
    await supabaseAdmin.from('match_lock_logs').insert({ match_id: matchId, action: 'AUTO_LOCKED', performed_by: getUserId(req), notes: 'Maç kilitlendi' });
    return NextResponse.json({ ok: true, data });
  } catch (err: any) {
    return jsonError('lock match failed', 500, err.message || err);
  }
}
