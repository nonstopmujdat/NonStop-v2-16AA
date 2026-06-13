import { NextResponse } from "next/server";
import { getSupabaseAdmin, hasSupabaseAdminConfig } from "@/lib/supabaseAdmin";

type AnyRow = Record<string, any>;

function num(value: any) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function makeLabel(player: AnyRow | undefined, fallbackId: number) {
  if (!player) return `Oyuncu ${fallbackId}`;
  const jersey = player.jersey_no ?? player.jersey_number ?? null;
  const name = [player.first_name, player.last_name].filter(Boolean).join(" ").trim();
  return `${jersey !== null && jersey !== undefined ? `#${jersey} ` : ""}${name || `Oyuncu ${fallbackId}`}`;
}

export async function GET(req: Request) {
  try {
    if (!hasSupabaseAdminConfig()) {
      return NextResponse.json({ ok: false, error: "Supabase admin config eksik." }, { status: 500 });
    }

    const url = new URL(req.url);
    const matchId = Number(url.searchParams.get("match_id") || 0);
    const teamId = Number(url.searchParams.get("team_id") || 0);

    if (!matchId || !teamId) {
      return NextResponse.json({ ok: false, error: "match_id ve team_id zorunlu." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: match, error: matchError } = await supabase
      .from("matches")
      .select("id, home_team_id, away_team_id, current_quarter, clock_seconds, status, home_score, away_score")
      .eq("id", matchId)
      .single();

    if (matchError) return NextResponse.json({ ok: false, error: matchError.message }, { status: 500 });

    const { data: scoreRows, error: scoreError } = await supabase
      .from("live_match_score")
      .select("match_id, team_id, points")
      .eq("match_id", matchId);

    if (scoreError) return NextResponse.json({ ok: false, error: scoreError.message }, { status: 500 });

    const { data: rosterRows, error: rosterError } = await supabase
      .from("match_rosters")
      .select("*")
      .eq("match_id", matchId)
      .eq("team_id", teamId)
      .order("id", { ascending: true });

    if (rosterError) return NextResponse.json({ ok: false, error: rosterError.message }, { status: 500 });

    const playerIds = Array.from(new Set((rosterRows || []).map((r: AnyRow) => num(r.player_id)).filter(Boolean)));
    let players: AnyRow[] = [];
    if (playerIds.length) {
      const { data, error } = await supabase
        .from("players")
        .select("id, first_name, last_name, jersey_no, jersey_number, team_id")
        .in("id", playerIds);
      if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
      players = data || [];
    }

    const playerMap = new Map<number, AnyRow>();
    for (const p of players) playerMap.set(num(p.id), p);

    const mappedRoster = (rosterRows || []).map((r: AnyRow) => {
      const playerId = num(r.player_id);
      const label = String(r.player_label || r.label || "").trim() || makeLabel(playerMap.get(playerId), playerId);
      return {
        player_id: playerId,
        label,
        is_starter: Boolean(r.is_starter),
        is_on_court: Boolean(r.is_on_court),
      };
    }).filter((r: AnyRow) => r.player_id && r.label);

    let onCourt = mappedRoster.filter((r: AnyRow) => r.is_on_court).map((r: AnyRow) => r.label);
    if (!onCourt.length) onCourt = mappedRoster.filter((r: AnyRow) => r.is_starter).map((r: AnyRow) => r.label);
    if (!onCourt.length) onCourt = mappedRoster.slice(0, 5).map((r: AnyRow) => r.label);
    onCourt = Array.from(new Set(onCourt)).slice(0, 5);

    const bench = mappedRoster
      .map((r: AnyRow) => r.label)
      .filter((label: string) => !onCourt.includes(label));

    const homeTeamId = num(match?.home_team_id);
    const awayTeamId = num(match?.away_team_id);
    const homeFromView = (scoreRows || []).find((r: AnyRow) => num(r.team_id) === homeTeamId)?.points;
    const awayFromView = (scoreRows || []).find((r: AnyRow) => num(r.team_id) === awayTeamId)?.points;

    return NextResponse.json({
      ok: true,
      match_id: matchId,
      team_id: teamId,
      home_team_id: homeTeamId,
      away_team_id: awayTeamId,
      home_score: num(homeFromView ?? match?.home_score ?? 0),
      away_score: num(awayFromView ?? match?.away_score ?? 0),
      current_quarter: num(match?.current_quarter || 1),
      clock_seconds: num(match?.clock_seconds ?? 600),
      status: match?.status || "DEVAM_EDIYOR",
      onCourt,
      bench,
      roster_count: mappedRoster.length,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err?.message || err) }, { status: 500 });
  }
}
