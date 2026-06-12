import { NextResponse } from "next/server";
import { getSupabaseAdmin, hasSupabaseAdminConfig } from "@/lib/supabaseAdmin";

type Action = "JOIN" | "HEARTBEAT" | "LEAVE" | "REJOIN";

function makeDeviceId(input?: string | null) {
  const value = String(input || "").trim();
  if (value) return value.slice(0, 120);
  return `device_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function POST(req: Request) {
  try {
    if (!hasSupabaseAdminConfig()) {
      return NextResponse.json({ ok: false, error: "Supabase admin config eksik." }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "JOIN").toUpperCase() as Action;
    const matchId = Number(body.match_id || 0);
    const teamId = Number(body.team_id || 0);
    const operatorSide = String(body.operator_side || "").trim() || "UNKNOWN";
    const deviceId = makeDeviceId(body.device_id);

    if (!matchId || !teamId) {
      return NextResponse.json({ ok: false, error: "match_id ve team_id zorunlu." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    if (action === "LEAVE") {
      const { error } = await supabase
        .from("operator_live_sessions")
        .update({ is_active: false, left_at: new Date().toISOString(), last_seen_at: new Date().toISOString() })
        .eq("match_id", matchId)
        .eq("team_id", teamId)
        .eq("device_id", deviceId)
        .eq("is_active", true);

      if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true, action, device_id: deviceId });
    }

    const { data: existing, error: existingError } = await supabase
      .from("operator_live_sessions")
      .select("id, match_id, team_id, operator_side, device_id, is_active, joined_at, last_seen_at, left_at")
      .eq("match_id", matchId)
      .eq("team_id", teamId)
      .eq("device_id", deviceId)
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json({ ok: false, error: existingError.message }, { status: 500 });
    }

    if (existing) {
      const { data, error } = await supabase
        .from("operator_live_sessions")
        .update({
          operator_side: operatorSide,
          is_active: true,
          last_seen_at: new Date().toISOString(),
          left_at: null,
        })
        .eq("id", existing.id)
        .select("id, match_id, team_id, operator_side, device_id, is_active, joined_at, last_seen_at, left_at")
        .single();

      if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true, action: action === "HEARTBEAT" ? "HEARTBEAT" : "REJOIN", device_id: deviceId, session: data });
    }

    const { data, error } = await supabase
      .from("operator_live_sessions")
      .insert({
        match_id: matchId,
        team_id: teamId,
        operator_side: operatorSide,
        device_id: deviceId,
        is_active: true,
        joined_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString(),
      })
      .select("id, match_id, team_id, operator_side, device_id, is_active, joined_at, last_seen_at, left_at")
      .single();

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, action: "JOIN", device_id: deviceId, session: data });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err?.message || err) }, { status: 500 });
  }
}
