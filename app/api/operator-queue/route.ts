import { NextResponse } from "next/server";
import { getSupabaseAdmin, hasSupabaseAdminConfig } from "@/lib/supabaseAdmin";

type AnyRow = Record<string, any>;

function textValue(value: any, fallback = "") {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function numValue(value: any): number | null {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function pickName(row: AnyRow | undefined | null, fallback: string) {
  if (!row) return fallback;
  return row.name || row.team_name || row.club_name || row.title || row.label || fallback;
}

function pickCityName(row: AnyRow | undefined | null, fallback: string) {
  if (!row) return fallback;
  return row.name || row.city_name || row.title || row.label || fallback;
}

function pickVenueName(row: AnyRow | undefined | null, fallback: string) {
  if (!row) return fallback;
  return row.name || row.venue_name || row.title || row.label || fallback;
}

function mapById(rows: AnyRow[] | null | undefined) {
  const map = new Map<number, AnyRow>();
  for (const row of rows || []) {
    const id = numValue(row.id);
    if (id) map.set(id, row);
  }
  return map;
}

function normalizeStatus(value: any) {
  return textValue(value).trim().toUpperCase();
}

function normalizeDateOnly(value: any) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

export async function GET() {
  try {
    if (!hasSupabaseAdminConfig()) {
      return NextResponse.json({ ok: false, error: "Supabase admin config eksik." }, { status: 500 });
    }

    const supabase = getSupabaseAdmin();

    const [citiesRes, venuesRes, teamsRes, matchesRes, competitionsRes, categoriesRes] = await Promise.all([
      supabase.from("cities").select("*").order("id", { ascending: true }),
      supabase.from("venues").select("*").order("id", { ascending: true }),
      supabase.from("teams").select("*").order("id", { ascending: true }),
      supabase.from("matches").select("*").order("match_date", { ascending: false }).order("match_time", { ascending: true }).order("id", { ascending: false }),
      supabase.from("competitions").select("*").order("id", { ascending: true }),
      supabase.from("categories").select("*").order("id", { ascending: true }),
    ]);

    if (matchesRes.error) {
      return NextResponse.json({ ok: false, error: matchesRes.error.message }, { status: 500 });
    }

    const cities = citiesRes.data || [];
    const venues = venuesRes.data || [];
    const teams = teamsRes.data || [];
    const matches = matchesRes.data || [];
    const competitions = competitionsRes.data || [];
    const categories = categoriesRes.data || [];

    const cityMap = mapById(cities);
    const venueMap = mapById(venues);
    const teamMap = mapById(teams);
    const competitionMap = mapById(competitions);
    const categoryMap = mapById(categories);

    const cityNames = Array.from(new Set(cities.map((c) => pickCityName(c, "Şehir")).filter(Boolean))).sort((a, b) => String(a).localeCompare(String(b), "tr"));

    const venueOptions = venues.map((v) => {
      const venueId = numValue(v.id) || 0;
      const cityId = numValue(v.city_id);
      const cityName = cityId ? pickCityName(cityMap.get(cityId), "Bursa") : textValue(v.city, "Bursa");
      return {
        id: venueId,
        city: cityName,
        name: pickVenueName(v, `Salon ${venueId}`),
      };
    });

    const today = new Date().toISOString().slice(0, 10);

    const visibleMatches = matches.filter((m) => {
      const status = normalizeStatus(m.status);
      const locked = Boolean(m.locked);
      const matchDate = normalizeDateOnly(m.match_date || m.match_datetime);

      if (locked) return false;

      // Kritik kural:
      // DEVAM_EDIYOR olan maçlar tarihinden bağımsız olarak her zaman operator ekranına gelir.
      // Böylece yarın Match ID 565 yarım kalırsa tekrar girilebilir.
      if (status === "DEVAM_EDIYOR") return true;

      // PLANLANDI maçlar ise bugünün maç listesinde görünür.
      if (status === "PLANLANDI" && (!matchDate || matchDate === today)) return true;

      return false;
    });

    const matchOptions = visibleMatches.map((m) => {
      const matchId = numValue(m.id) || 0;
      const homeTeamId = numValue(m.home_team_id);
      const awayTeamId = numValue(m.away_team_id);
      const venueId = numValue(m.venue_id);
      const venue = venueId ? venueMap.get(venueId) : null;
      const cityId = numValue(m.city_id) || (venueId ? numValue(venue?.city_id) : null);
      const city = cityId ? cityMap.get(cityId) : null;
      const competitionId = numValue(m.competition_id);
      const categoryId = numValue(m.category_id);
      const homeTeam = homeTeamId ? teamMap.get(homeTeamId) : null;
      const awayTeam = awayTeamId ? teamMap.get(awayTeamId) : null;
      const competition = competitionId ? competitionMap.get(competitionId) : null;
      const category = categoryId ? categoryMap.get(categoryId) : null;
      const status = normalizeStatus(m.status);

      const matchTime =
        m.match_time ||
        m.time ||
        (m.match_datetime ? String(m.match_datetime).slice(11, 16) : "") ||
        "Bugün";

      return {
        id: matchId,
        time: matchTime,
        city: pickCityName(city, textValue(m.city, "Bursa")),
        venue: pickVenueName(venue, textValue(m.venue, "Demo Salon")),
        home: pickName(homeTeam, `Ev Sahibi ${homeTeamId || ""}`.trim()),
        away: pickName(awayTeam, `Misafir ${awayTeamId || ""}`.trim()),
        homeTeamId,
        awayTeamId,
        status,
        locked: Boolean(m.locked),
        isResumeMatch: status === "DEVAM_EDIYOR",
        category: pickName(category, textValue(m.category, "SERBEST")),
        competition: pickName(competition, textValue(m.competition, "Lig / Test Maçı")),
        competitionType: m.competition_type || m.match_type || m.match_kind || "LEAGUE",
        matchKind: m.match_kind || m.match_type || null,
        rosterLimit: Number(m.roster_limit || 12),
      };
    });

    const resumeMatches = matchOptions.filter((m) => m.isResumeMatch);

    return NextResponse.json({
      ok: true,
      source: "supabase",
      cities: cityNames.length ? cityNames : ["Bursa"],
      venues: venueOptions,
      matches: matchOptions,
      resumeMatches,
      adminCities: cityNames.length ? cityNames : ["Bursa"],
      adminVenues: venueOptions,
      adminMatches: matchOptions,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err?.message || err) }, { status: 500 });
  }
}
