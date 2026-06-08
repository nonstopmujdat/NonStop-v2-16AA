import { NextResponse } from 'next/server';
import { getUserId, hasSupabaseAdminEnv, insertOne, jsonError } from '@/lib/apiHelpers';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const made = Boolean(body.made);
    const eventType = made ? 'FTM' : 'FTA_MISS';
    const eventPayload = {
      client_event_id: body.client_event_id || body.event_id,
      match_id: body.match_id,
      team_id: body.team_id,
      player_id: body.player_id,
      quarter: body.quarter || 1,
      game_clock: body.game_clock,
      event_type: eventType,
      event_tags: made ? 'FT' : 'FT-K',
      created_by: getUserId(req)
    };

    if (!hasSupabaseAdminEnv()) {
      return NextResponse.json({ ok: true, mode: 'demo-no-db', data: eventPayload });
    }

    if (!eventPayload.match_id || !eventPayload.team_id || !eventPayload.player_id) {
      return jsonError('match_id, team_id and player_id are required when Supabase is connected');
    }

    const event = await insertOne('match_events', eventPayload);
    await insertOne('shot_events', {
      match_event_id: event.id,
      x: body.shot_x || 23,
      y: body.shot_y || 50,
      shot_zone: 'FREE_THROW_LINE',
      shot_type: 'FREE_THROW',
      made,
      is_free_throw: true,
      free_throw_order: body.free_throw_order,
      free_throw_total: body.free_throw_total,
      label: made ? 'FT' : 'FT-K'
    });

    return NextResponse.json({ ok: true, data: event });
  } catch (err: any) {
    return jsonError('free throw insert failed', 500, err.message || err);
  }
}
