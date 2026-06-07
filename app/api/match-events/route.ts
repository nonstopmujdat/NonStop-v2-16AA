import { NextResponse } from 'next/server';
import { getUserId, hasSupabaseAdminEnv, jsonError } from '@/lib/apiHelpers';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

// NONSTOP V2.1.18
// Goal: every operator event must POST to Supabase and return a visible success/error result.
// The database may contain either stable event_type values or older legacy values.
// We first try the stable value, then fall back to legacy values when Supabase rejects it.
const STABLE_EVENT_TYPE_MAP: Record<string, string> = {
  '2PM': '2PA_MADE',
  '2PA': '2PA_MISS',
  '2PA_MADE': '2PA_MADE',
  '2PA_MISS': '2PA_MISS',
  '3PM': '3PA_MADE',
  '3PA': '3PA_MISS',
  '3PA_MADE': '3PA_MADE',
  '3PA_MISS': '3PA_MISS',
  'FTM': 'FTA_MADE',
  'FTA': 'FTA_MISS',
  'FTA_MADE': 'FTA_MADE',
  'FTA_MISS': 'FTA_MISS',
  'PF': 'FOUL',
  'FOUL': 'FOUL',
  'FD': 'FOUL_DRAWN',
  'FOUL_DRAWN': 'FOUL_DRAWN',
  'BY': 'BLK_AGAINST',
  'BLOCKED': 'BLK_AGAINST',
  'BLK_AGAINST': 'BLK_AGAINST',
  'BLK': 'BLK',
  'AST': 'AST',
  'OREB': 'OREB',
  'DREB': 'DREB',
  'STL': 'STL',
  'TOV': 'TOV',
  'TIMEOUT': 'TIMEOUT',
  'SUBSTITUTION': 'SUBSTITUTION',
  'CHARGE_DRAWN': 'CHARGE_DRAWN'
};

const LEGACY_EVENT_TYPE_MAP: Record<string, string> = {
  '2PA_MADE': '2PM',
  '3PA_MADE': '3PM',
  'FTA_MADE': 'FTM',
  'FOUL': 'PF',
  'FOUL_DRAWN': 'FD',
  'BLK_AGAINST': 'BY'
};

function normalizeEventType(value: unknown) {
  const raw = String(value || '').trim().toUpperCase();
  return STABLE_EVENT_TYPE_MAP[raw] || '';
}

function asInteger(value: unknown, fallback?: number) {
  if (value === null || value === undefined || value === '') return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function shotInfo(eventType: string) {
  if (eventType === '2PA_MADE') return { points: 2, made: true, family: 'SHOT' };
  if (eventType === '2PA_MISS') return { points: 2, made: false, family: 'SHOT' };
  if (eventType === '3PA_MADE') return { points: 3, made: true, family: 'SHOT' };
  if (eventType === '3PA_MISS') return { points: 3, made: false, family: 'SHOT' };
  if (eventType === 'FTA_MADE') return { points: 1, made: true, family: 'FREE_THROW' };
  if (eventType === 'FTA_MISS') return { points: 1, made: false, family: 'FREE_THROW' };
  return null;
}

function buildTags(existingTags: unknown, eventType: string) {
  const tags = new Set<string>();
  const existing = String(existingTags || '').trim();
  if (existing) existing.split(/[;,\-|\s]+/).filter(Boolean).forEach(t => tags.add(t));
  const shot = shotInfo(eventType);
  if (shot) {
    tags.add(`POINTS_${shot.points}`);
    tags.add(shot.made ? 'MADE' : 'MISS');
    tags.add(shot.family);
  }
  return Array.from(tags).join(';') || null;
}

function cleanPayload(payload: Record<string, any>) {
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (value !== undefined && value !== '') cleaned[key] = value;
  }
  return cleaned;
}

function errorText(error: any) {
  if (!error) return 'unknown error';
  return [error.code, error.message, error.details, error.hint].filter(Boolean).join(' | ');
}

async function insertMatchEvent(payload: Record<string, any>) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from('match_events').insert(cleanPayload(payload)).select().single();
  if (error) throw error;
  return data;
}



type StatDelta = {
  points?: number;
  rebounds?: number;
  assists?: number;
  steals?: number;
  blocks?: number;
  turnovers?: number;
  fouls?: number;
};

function statDeltaForEvent(eventType: string): StatDelta {
  switch (eventType) {
    case '2PA_MADE':
    case '2PM':
      return { points: 2 };
    case '3PA_MADE':
    case '3PM':
      return { points: 3 };
    case 'FTA_MADE':
    case 'FTM':
      return { points: 1 };
    case 'OREB':
    case 'DREB':
      return { rebounds: 1 };
    case 'AST':
      return { assists: 1 };
    case 'STL':
      return { steals: 1 };
    case 'BLK':
      return { blocks: 1 };
    case 'TOV':
      return { turnovers: 1 };
    case 'FOUL':
    case 'PF':
      return { fouls: 1 };
    default:
      return {};
  }
}

function hasStatDelta(delta: StatDelta) {
  return Object.values(delta).some(v => Number(v || 0) !== 0);
}

async function incrementPlayerGameStats(insertedEvent: any, normalizedEventType: string) {
  const matchId = asInteger(insertedEvent?.match_id);
  const playerId = asInteger(insertedEvent?.player_id);
  const teamId = asInteger(insertedEvent?.team_id);
  if (!matchId || !playerId) return { skipped: true, reason: 'missing_match_or_player' };

  const delta = statDeltaForEvent(normalizedEventType);
  if (!hasStatDelta(delta)) return { skipped: true, reason: 'no_player_stat_delta' };

  const supabase = getSupabaseAdmin();
  const { data: existing, error: lookupError } = await supabase
    .from('player_game_stats')
    .select('id,team_id,points,rebounds,assists,steals,blocks,turnovers,fouls')
    .eq('match_id', matchId)
    .eq('player_id', playerId)
    .maybeSingle();
  if (lookupError) throw lookupError;

  const nextValues: Record<string, any> = {
    team_id: Number(existing?.team_id || 0) || teamId || null,
    points: Number(existing?.points || 0) + Number(delta.points || 0),
    rebounds: Number(existing?.rebounds || 0) + Number(delta.rebounds || 0),
    assists: Number(existing?.assists || 0) + Number(delta.assists || 0),
    steals: Number(existing?.steals || 0) + Number(delta.steals || 0),
    blocks: Number(existing?.blocks || 0) + Number(delta.blocks || 0),
    turnovers: Number(existing?.turnovers || 0) + Number(delta.turnovers || 0),
    fouls: Number(existing?.fouls || 0) + Number(delta.fouls || 0)
  };

  if (existing?.id) {
    const { data, error } = await supabase
      .from('player_game_stats')
      .update(nextValues)
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw error;
    return { skipped: false, action: 'updated', data };
  }

  const { data, error } = await supabase
    .from('player_game_stats')
    .insert({ match_id: matchId, player_id: playerId, team_id: teamId || null, ...nextValues })
    .select()
    .single();
  if (error) throw error;
  return { skipped: false, action: 'inserted', data };
}

async function incrementTeamGameStats(insertedEvent: any, normalizedEventType: string) {
  const matchId = asInteger(insertedEvent?.match_id);
  const teamId = asInteger(insertedEvent?.team_id);
  if (!matchId || !teamId) return { skipped: true, reason: 'missing_match_or_team' };

  const delta = statDeltaForEvent(normalizedEventType);
  if (!hasStatDelta(delta)) return { skipped: true, reason: 'no_team_stat_delta' };

  const supabase = getSupabaseAdmin();
  const { data: existing, error: lookupError } = await supabase
    .from('team_game_stats')
    .select('id,team_id,points,rebounds,assists,steals,blocks,turnovers,fouls')
    .eq('match_id', matchId)
    .eq('team_id', teamId)
    .maybeSingle();
  if (lookupError) throw lookupError;

  const nextValues: Record<string, any> = {
    team_id: Number(existing?.team_id || 0) || teamId || null,
    points: Number(existing?.points || 0) + Number(delta.points || 0),
    rebounds: Number(existing?.rebounds || 0) + Number(delta.rebounds || 0),
    assists: Number(existing?.assists || 0) + Number(delta.assists || 0),
    steals: Number(existing?.steals || 0) + Number(delta.steals || 0),
    blocks: Number(existing?.blocks || 0) + Number(delta.blocks || 0),
    turnovers: Number(existing?.turnovers || 0) + Number(delta.turnovers || 0),
    fouls: Number(existing?.fouls || 0) + Number(delta.fouls || 0)
  };

  if (existing?.id) {
    const { data, error } = await supabase
      .from('team_game_stats')
      .update(nextValues)
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw error;
    return { skipped: false, action: 'updated', data };
  }

  const { data, error } = await supabase
    .from('team_game_stats')
    .insert({ match_id: matchId, team_id: teamId, ...nextValues })
    .select()
    .single();
  if (error) throw error;
  return { skipped: false, action: 'inserted', data };
}

async function updateStatsAfterEvent(insertedEvent: any, normalizedEventType: string) {
  const result: Record<string, any> = { player_stats: null, team_stats: null };
  try {
    result.player_stats = await incrementPlayerGameStats(insertedEvent, normalizedEventType);
  } catch (err: any) {
    result.player_stats = { ok: false, error: errorText(err) };
  }
  try {
    result.team_stats = await incrementTeamGameStats(insertedEvent, normalizedEventType);
  } catch (err: any) {
    result.team_stats = { ok: false, error: errorText(err) };
  }
  return result;
}

async function tryInsertWithSafePlayer(payload: Record<string, any>, notesObject: Record<string, any>) {
  try {
    const data = await insertMatchEvent(payload);
    return { data, safePlayerFallback: false };
  } catch (err: any) {
    const text = errorText(err);
    // V2.1.17: function moved outside the request block so TypeScript/ES5 build accepts it.
    // Demo oyuncu ID'leri veritabanında yoksa kayıt tamamen düşmesin.
    // player_id nullable olduğu için oyuncuyu notes içinde koruyup kaydı null player_id ile tekrar deneriz.
    if (String(err?.code) === '23503' && /player_id|related_player_id|players/i.test(text)) {
      const safePayload = {
        ...payload,
        player_id: null,
        related_player_id: null,
        notes: JSON.stringify({
          ...notesObject,
          player_fk_error: text,
          original_player_id: payload.player_id,
          original_related_player_id: payload.related_player_id
        })
      };
      const data = await insertMatchEvent(safePayload);
      return { data, safePlayerFallback: true };
    }
    throw err;
  }
}

export async function POST(req: Request) {
  let body: any = null;
  try {
    body = await req.json();
    const rawEventType = body.event_type || body.type;
    const eventType = normalizeEventType(rawEventType);

    if (!eventType) {
      return jsonError(`unsupported event_type: ${rawEventType || '(empty)'}`, 400, { received: rawEventType, body });
    }

    const quarter = Math.max(1, asInteger(body.quarter, 1) || 1);
    const matchId = asInteger(body.match_id, 1) || 1;
    const teamId = asInteger(body.team_id, 1) || 1;
    const playerId = asInteger(body.player_id);
    const relatedPlayerId = asInteger(body.related_player_id);
    const gameClock = body.game_clock || body.clock || '10:00';

    const notesObject = {
      raw_event_type: rawEventType,
      normalized_event_type: eventType,
      player_label: body.player_label || body.player,
      shot_x: body.shot_x,
      shot_y: body.shot_y,
      foul_x: body.foul_x,
      foul_y: body.foul_y,
      made: body.made,
      points: shotInfo(eventType)?.points,
      original_payload: body
    };

    const basePayload: Record<string, any> = {
      client_event_id: body.client_event_id || body.event_id,
      match_id: matchId,
      team_id: teamId,
      player_id: playerId,
      related_player_id: relatedPlayerId,
      quarter,
      game_clock: gameClock,
      event_type: eventType,
      event_tags: buildTags(body.event_tags, eventType),
      linked_basket_id: body.linked_basket_id || null,
      operator_side: body.operator_side || 'HOME_OPERATOR',
      sync_source: body.sync_source || 'OPERATOR_WEB',
      client_created_at: body.client_created_at || body.created_local_at || new Date().toISOString(),
      created_by: getUserId(req),
      notes: JSON.stringify(notesObject)
    };

    if (!Number.isFinite(Number(basePayload.match_id)) || !Number.isFinite(Number(basePayload.team_id)) || !Number.isFinite(Number(basePayload.quarter))) {
      return jsonError('match_id, team_id and quarter are required and must be numbers', 400, basePayload);
    }

    if (!hasSupabaseAdminEnv()) {
      return jsonError('Supabase admin environment missing. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Render Environment, then redeploy.', 500, {
        required: ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'],
        payload: basePayload
      });
    }

    try {
      const result = await tryInsertWithSafePlayer(basePayload, notesObject);
      const stats = await updateStatsAfterEvent(result.data, eventType);
      return NextResponse.json({ ok: true, data: result.data, event_type_used: eventType, safe_player_fallback: result.safePlayerFallback, stats });
    } catch (firstError: any) {
      const legacyType = LEGACY_EVENT_TYPE_MAP[eventType];
      if (!legacyType) {
        return jsonError('match event insert failed', 500, { error: errorText(firstError), payload: basePayload });
      }

      const legacyPayload = {
        ...basePayload,
        event_type: legacyType,
        event_tags: buildTags(`${basePayload.event_tags || ''};STABLE_${eventType}`, legacyType),
        notes: JSON.stringify({ ...notesObject, stable_event_type: eventType, legacy_event_type: legacyType, first_error: errorText(firstError) })
      };

      try {
        const result = await tryInsertWithSafePlayer(legacyPayload, notesObject);
        const stats = await updateStatsAfterEvent(result.data, eventType);
        return NextResponse.json({ ok: true, data: result.data, event_type_used: legacyType, stable_event_type: eventType, fallback: true, safe_player_fallback: result.safePlayerFallback, stats });
      } catch (secondError: any) {
        return jsonError('match event insert failed after legacy fallback', 500, {
          stable_error: errorText(firstError),
          legacy_error: errorText(secondError),
          stable_payload: basePayload,
          legacy_payload: legacyPayload
        });
      }
    }
  } catch (err: any) {
    return jsonError('match event request failed', 500, { error: err?.message || String(err), body });
  }
}
