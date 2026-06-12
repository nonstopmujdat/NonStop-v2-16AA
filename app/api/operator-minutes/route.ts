import { NextResponse } from "next/server";
import { getSupabaseAdmin, hasSupabaseAdminConfig } from "@/lib/supabaseAdmin";

type MinutesAction = "OPEN_STARTERS" | "OPEN_PLAYER" | "CLOSE_PLAYER" | "CLOSE_TEAM_OPEN";

type MinutesPayload = {
  action?: MinutesAction;
  match_id?: number;
  team_id?: number;
  player_id?: number;
  quarter?: number;
  clock_seconds?: number;
  game_clock?: string;
};

function asBigIntNumber(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function asSmallInt(value: unknown, fallback = 1) {
  const n = Number(value ?? fallback);
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : fallback;
}

function asClockSeconds(value: unknown, fallback = 600) {
  const n = Number(value ?? fallback);
  return Number.isFinite(n) && n >= 0 ? Math.trunc(n) : fallback;
}

function asGameClock(value: unknown, fallback = "10:00") {
  const s = String(value || fallback).trim();
  return s || fallback;
}

export async function POST(req: Request) {
  try {
    if (!hasSupabaseAdminConfig()) {
      return NextResponse.json(
        { ok: false, error: "Supabase admin config eksik." },
        { status: 500 }
      );
    }

    const body = (await req.json().catch(() => ({}))) as MinutesPayload;
    const action = body.action;
    const matchId = asBigIntNumber(body.match_id);
    const teamId = asBigIntNumber(body.team_id);
    const playerId = asBigIntNumber(body.player_id);
    const quarter = asSmallInt(body.quarter, 1);
    const clockSeconds = asClockSeconds(body.clock_seconds, 600);
    const gameClock = asGameClock(body.game_clock, "10:00");

    if (!action) {
      return NextResponse.json({ ok: false, error: "action zorunlu." }, { status: 400 });
    }
    if (!matchId) {
      return NextResponse.json({ ok: false, error: "match_id zorunlu." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    if (action === "OPEN_STARTERS") {
      if (!teamId) {
        return NextResponse.json({ ok: false, error: "OPEN_STARTERS için team_id zorunlu." }, { status: 400 });
      }

      const { error } = await supabase.rpc("nonstop_open_starter_sessions", {
        p_match_id: matchId,
        p_team_id: teamId,
        p_quarter: quarter,
        p_clock_seconds: clockSeconds,
        p_game_clock: gameClock,
      });

      if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true, action, match_id: matchId, team_id: teamId });
    }

    if (action === "OPEN_PLAYER") {
      if (!teamId || !playerId) {
        return NextResponse.json({ ok: false, error: "OPEN_PLAYER için team_id ve player_id zorunlu." }, { status: 400 });
      }

      const { error } = await supabase.rpc("nonstop_open_player_session", {
        p_match_id: matchId,
        p_team_id: teamId,
        p_player_id: playerId,
        p_quarter: quarter,
        p_clock_seconds: clockSeconds,
        p_game_clock: gameClock,
      });

      if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true, action, match_id: matchId, team_id: teamId, player_id: playerId });
    }

    if (action === "CLOSE_PLAYER") {
      if (!playerId) {
        return NextResponse.json({ ok: false, error: "CLOSE_PLAYER için player_id zorunlu." }, { status: 400 });
      }

      const { error } = await supabase.rpc("nonstop_close_player_session", {
        p_match_id: matchId,
        p_player_id: playerId,
        p_clock_seconds: clockSeconds,
        p_game_clock: gameClock,
      });

      if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true, action, match_id: matchId, player_id: playerId });
    }

    if (action === "CLOSE_TEAM_OPEN") {
      if (!teamId) {
        return NextResponse.json({ ok: false, error: "CLOSE_TEAM_OPEN için team_id zorunlu." }, { status: 400 });
      }

      const { data: openSessions, error: selectError } = await supabase
        .from("player_time_sessions")
        .select("id, start_clock_seconds")
        .eq("match_id", matchId)
        .eq("team_id", teamId)
        .is("end_clock_seconds", null);

      if (selectError) {
        return NextResponse.json({ ok: false, error: selectError.message }, { status: 500 });
      }

      const rows = openSessions || [];
      for (const row of rows) {
        const startClock = Number(row.start_clock_seconds ?? clockSeconds);
        const sessionSeconds = Math.max(0, startClock - clockSeconds);
        const { error: updateError } = await supabase
          .from("player_time_sessions")
          .update({
            end_clock_seconds: clockSeconds,
            end_game_clock: gameClock,
            session_seconds: sessionSeconds,
            closed_at: new Date().toISOString(),
          })
          .eq("id", row.id);

        if (updateError) {
          return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
        }
      }

      return NextResponse.json({ ok: true, action, match_id: matchId, team_id: teamId, closed_count: rows.length });
    }

    return NextResponse.json({ ok: false, error: `Bilinmeyen action: ${String(action)}` }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err?.message || err) }, { status: 500 });
  }
}
