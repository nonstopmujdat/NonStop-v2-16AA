import { NextResponse } from 'next/server';
import { getUserId, hasSupabaseAdminEnv, jsonError } from '@/lib/apiHelpers';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request, { params }: { params: { matchId: string } }) {
  try {
    const body = await req.json().catch(() => ({}));
    const matchId = Number(params.matchId);
    const editWindowMinutes = Number(body.edit_window_minutes || 15);
    const autoLockAt = new Date(Date.now() + editWindowMinutes * 60 * 1000).toISOString();

    if (!hasSupabaseAdminEnv()) {
      return NextResponse.json({ ok: true, mode: 'demo-no-db', match_id: matchId, status: 'TAMAMLANDI', auto_lock_at: autoLockAt });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('matches')
      .update({ status: 'TAMAMLANDI', finished_at: new Date().toISOString(), auto_lock_at: autoLockAt, edit_window_minutes: editWindowMinutes })
      .eq('id', matchId)
      .select()
      .single();
    if (error) throw error;

    await supabaseAdmin.from('match_lock_logs').insert({ match_id: matchId, action: 'FINISHED', performed_by: getUserId(req), notes: `${editWindowMinutes} dakika düzenleme süresi başladı` });
    return NextResponse.json({ ok: true, data });
  } catch (err: any) {
    return jsonError('finish match failed', 500, err.message || err);
  }
}
