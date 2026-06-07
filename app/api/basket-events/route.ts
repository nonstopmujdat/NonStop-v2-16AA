import { NextResponse } from 'next/server';
import { getUserId, hasSupabaseAdminEnv, insertOne, jsonError } from '@/lib/apiHelpers';
import { createLinkedBasketId, createClientEventId } from '@/lib/ids';
import { buildShotLabel } from '@/lib/score';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const points = Number(body.points || 2) === 3 ? 3 : 2;
    const linkedBasketId = body.linked_basket_id || createLinkedBasketId();
    const eventType = points === 3 ? '3PM' : '2PM';
    const assisted = Boolean(body.assist_player_id);
    const andOne = Boolean(body.foul_committed_by_player_id);
    const label = buildShotLabel({ assisted, andOne, made: true });
    const userId = getUserId(req);

    const base = {
      client_event_id: body.client_event_id || createClientEventId('basket'),
      match_id: body.match_id,
      team_id: body.team_id,
      player_id: body.shooter_player_id || body.player_id,
      quarter: body.quarter || 1,
      game_clock: body.game_clock,
      event_type: eventType,
      event_tags: label,
      linked_basket_id: linkedBasketId,
      created_by: userId
    };

    if (!hasSupabaseAdminEnv()) {
      return NextResponse.json({ ok: true, mode: 'demo-no-db', linked_basket_id: linkedBasketId, basket_event: base });
    }

    if (!base.match_id || !base.team_id || !base.player_id) {
      return jsonError('match_id, team_id and shooter_player_id/player_id are required when Supabase is connected');
    }

    const basketEvent = await insertOne('match_events', base);

    await insertOne('basket_event_links', {
      linked_basket_id: linkedBasketId,
      match_id: body.match_id,
      shooter_event_id: basketEvent.id,
      shooter_player_id: base.player_id,
      assist_player_id: body.assist_player_id || null,
      foul_committed_by_player_id: body.foul_committed_by_player_id || null,
      assist_status: body.assist_player_id ? 'YES' : 'NONE',
      foul_status: body.foul_committed_by_player_id ? 'YES' : 'NONE',
      created_by: userId,
      updated_by: userId
    });

    await insertOne('shot_events', {
      match_event_id: basketEvent.id,
      x: body.shot_x,
      y: body.shot_y,
      shot_zone: body.shot_zone,
      shot_type: body.shot_type,
      made: true,
      assisted,
      and_one: andOne,
      label
    });

    if (body.assist_player_id) {
      await insertOne('match_events', {
        match_id: body.match_id,
        team_id: body.team_id,
        player_id: body.assist_player_id,
        quarter: body.quarter || 1,
        game_clock: body.game_clock,
        event_type: 'AST',
        linked_basket_id: linkedBasketId,
        created_by: userId
      });
    }

    if (body.foul_committed_by_player_id) {
      await insertOne('match_events', {
        match_id: body.match_id,
        team_id: body.team_id,
        player_id: base.player_id,
        quarter: body.quarter || 1,
        game_clock: body.game_clock,
        event_type: 'FD',
        linked_basket_id: linkedBasketId,
        created_by: userId
      });
      await insertOne('match_events', {
        match_id: body.match_id,
        team_id: body.foul_team_id || body.team_id,
        player_id: body.foul_committed_by_player_id,
        quarter: body.quarter || 1,
        game_clock: body.game_clock,
        event_type: 'PF',
        linked_basket_id: linkedBasketId,
        created_by: userId
      });
    }

    return NextResponse.json({ ok: true, linked_basket_id: linkedBasketId, basket_event: basketEvent });
  } catch (err: any) {
    return jsonError('basket event insert failed', 500, err.message || err);
  }
}
