import { NextResponse } from "next/server";
import { getSupabaseAdmin, hasSupabaseAdminConfig } from "@/lib/supabaseAdmin";

type MatchRow = {
  id: number;
  home_team_id: number | null;
  away_team_id: number | null;
  current_quarter: number | null;
  clock_seconds: number | null;
  status: string | null;
  home_score: number | null;
  away_score: number | null;
};

type LiveScoreRow = {
  match_id: number;
  team_id: number;
  points: number | null;
  updated_at: string | null;
};

export async function GET(req: Request) {
  try {
    if (!hasSupabaseAdminConfig()) {
      return NextResponse.json(
        { ok: false, error: "Supabase admin config eksik." },
        { status: 500 },
      );
    }

    const url = new URL(req.url);
    const matchId = Number(url.searchParams.get("match_id") || 0);

    if (!matchId) {
      return NextResponse.json(
        { ok: false, error: "match_id zorunlu." },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdmin();

    const { data: match, error: matchError } = await supabase
      .from("matches")
      .select("id, home_team_id, away_team_id, current_quarter, clock_seconds, status, home_score, away_score")
      .eq("id", matchId)
      .single();

    if (matchError) {
      return NextResponse.json(
        { ok: false, error: matchError.message },
        { status: 500 },
      );
    }

    const m = match as MatchRow;

    const { data: rows, error: scoreError } = await supabase
      .from("live_match_score")
      .select("match_id, team_id, points, updated_at")
      .eq("match_id", matchId);

    if (scoreError) {
      return NextResponse.json(
        { ok: false, error: scoreError.message },
        { status: 500 },
      );
    }

    const scoreRows = (rows || []) as LiveScoreRow[];
    const homeTeamId = Number(m.home_team_id || 0);
    const awayTeamId = Number(m.away_team_id || 0);

    const homeFromView = scoreRows.find((r) => Number(r.team_id) === homeTeamId)?.points;
    const awayFromView = scoreRows.find((r) => Number(r.team_id) === awayTeamId)?.points;

    const homeScore = Number(homeFromView ?? m.home_score ?? 0);
    const awayScore = Number(awayFromView ?? m.away_score ?? 0);

    return NextResponse.json({
      ok: true,
      match_id: matchId,
      home_team_id: homeTeamId,
      away_team_id: awayTeamId,
      home_score: homeScore,
      away_score: awayScore,
      current_quarter: Number(m.current_quarter || 1),
      clock_seconds: Number(m.clock_seconds ?? 600),
      status: m.status || "PLANLANDI",
      updated_at: scoreRows.map((r) => r.updated_at).filter(Boolean).sort().pop() || null,
      source: "live_match_score",
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: String(err?.message || err) },
      { status: 500 },
    );
  }
}
