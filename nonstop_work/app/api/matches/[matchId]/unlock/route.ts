import { NextResponse } from 'next/server';
import { getUserId, hasSupabaseAdminEnv, jsonError } from '@/lib/apiHelpers';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request, { params }: { params: { matchId: string } }) {
  try {
    const body = await req.json().catch(() => ({}));
    const matchId = Number(params.matchId);
    if (!hasSupabaseAdminEnv()) return NextResponse.json({ ok: true, mode: 'demo-no-db', match_id: matchId, locked: false });

    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin.from('matches').update({ locked: false, locked_at: null }).eq('id', matchId).select().single();
    if (error) throw error;
    await supabaseAdmin.from('match_lock_logs').insert({ match_id: matchId, action: 'UNLOCKED', performed_by: getUserId(req), notes: body.notes || 'Kilit açıldı' });
    return NextResponse.json({ ok: true, data });
  } catch (err: any) {
    return jsonError('unlock match failed', 500, err.message || err);
  }
}
