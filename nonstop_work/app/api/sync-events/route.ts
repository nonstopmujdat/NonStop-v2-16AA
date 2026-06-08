import { NextResponse } from 'next/server';
import { getUserId, hasSupabaseAdminEnv, jsonError } from '@/lib/apiHelpers';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const events = body.events || [];
    if (!Array.isArray(events)) return jsonError('events must be an array');

    if (!hasSupabaseAdminEnv()) {
      return NextResponse.json({
        ok: true,
        mode: 'demo-no-db',
        count: events.length,
        results: events.map((e: any) => ({ event_id: e.event_id, status: 'received-demo' }))
      });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const results = [];
    for (const evt of events) {
      if (!evt.event_id) {
        results.push({ event_id: null, status: 'rejected', error: 'event_id required' });
        continue;
      }

      const { data: existing, error: lookupError } = await supabaseAdmin
        .from('sync_events')
        .select('id,event_id')
        .eq('event_id', evt.event_id)
        .maybeSingle();
      if (lookupError) throw lookupError;

      if (existing) {
        results.push({ event_id: evt.event_id, status: 'duplicate' });
        continue;
      }

      const { error } = await supabaseAdmin.from('sync_events').insert({
        event_id: evt.event_id,
        match_id: evt.match_id || body.match_id,
        linked_basket_id: evt.linked_basket_id,
        operator_user_id: getUserId(req),
        operator_side: evt.operator_side || body.operator_side,
        event_payload: evt,
        client_created_at: evt.created_local_at
      });
      if (error) throw error;
      results.push({ event_id: evt.event_id, status: 'received' });
    }

    return NextResponse.json({ ok: true, count: results.length, results });
  } catch (err: any) {
    return jsonError('sync failed', 500, err.message || err);
  }
}
