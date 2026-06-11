import { NextResponse } from "next/server";
import { getSupabaseAdmin, hasSupabaseAdminConfig } from "@/lib/supabaseAdmin";

type PlayerRow = {
  id: number;
  first_name: string | null;
  last_name: string | null;
  jersey_no: number | null;
  jersey_number: number | null;
  team_id: number | null;
};

function makeLabel(player: PlayerRow) {
  const jersey = player.jersey_no ?? player.jersey_number ?? null;
  const name = [player.first_name, player.last_name].filter(Boolean).join(" ").trim();
  return `${jersey !== null ? `#${jersey} ` : ""}${name || `Oyuncu ${player.id}`}`;
}

export async function GET(req: Request) {
  try {
    if (!hasSupabaseAdminConfig()) {
      return NextResponse.json({ ok: false, error: "Supabase admin config eksik." }, { status: 500 });
    }

    const url = new URL(req.url);
    const homeTeamId = Number(url.searchParams.get("home_team_id") || 0);
    const awayTeamId = Number(url.searchParams.get("away_team_id") || 0);

    if (!homeTeamId || !awayTeamId) {
      return NextResponse.json({ ok: false, error: "home_team_id ve away_team_id zorunlu." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("players")
      .select("id, first_name, last_name, jersey_no, jersey_number, team_id")
      .in("team_id", [homeTeamId, awayTeamId])
      .order("team_id", { ascending: true })
      .order("jersey_no", { ascending: true })
      .order("id", { ascending: true });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const players = (data || []) as PlayerRow[];
    const mapped = players.map((p) => ({
      id: p.id,
      label: makeLabel(p),
      jersey_no: p.jersey_no ?? p.jersey_number ?? null,
      team_id: Number(p.team_id),
    }));

    return NextResponse.json({
      ok: true,
      homePlayers: mapped.filter((p) => p.team_id === homeTeamId),
      awayPlayers: mapped.filter((p) => p.team_id === awayTeamId),
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err?.message || err) }, { status: 500 });
  }
}
