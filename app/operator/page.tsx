"use client";

import { useEffect, useRef, useState } from "react";
import {
  createEventId,
  createLinkedBasketId,
  enqueue,
  markSynced,
  getQueue,
} from "@/lib/offlineQueue";

type ShotContext = {
  linked_basket_id: string;
  player: string;
  points: 1 | 2 | 3;
  made: boolean;
  assist?: string;
  foul?: string;
  tags: string[];
};

type CourtMarker = {
  id: string;
  x: number;
  y: number;
  label: string;
  made: boolean;
  kind: "shot" | "foul";
};

type CourtTab = "court" | "shots" | "fouls" | "heat";
type OperatorSide = "HOME" | "AWAY";
type FlowStep = "CITY" | "VENUE" | "MATCH" | "ROSTER" | "STARTERS" | "GAME";

type DemoVenue = { id: number; city: string; name: string };
type DemoMatch = {
  id:number;
  time:string;
  city:string;
  venue:string;
  home:string;
  away:string;
  category:string;
  competition:string;
  competitionType?: "LEAGUE" | "TOURNAMENT" | "FRIENDLY" | "SPECIAL_MATCH";
  countsForStandings?: boolean;
  countsForSeasonStats?: boolean;
  homeTeamId?: number | null;
  awayTeamId?: number | null;
};
type PlayerOption = {
  id: number;
  label: string;
  jersey_no: number | null;
  team_id: number;
};
const DEMO_CITIES = ["Bursa", "İstanbul", "İzmir", "Ankara", "Kocaeli"];
const DEMO_VENUES: DemoVenue[] = [
  { id: 1, city: "Bursa", name: "Nilüfer Spor Salonu" },
  { id: 2, city: "Bursa", name: "Tofaş Spor Salonu" },
  { id: 3, city: "Bursa", name: "Atatürk Spor Salonu" },
  { id: 4, city: "İstanbul", name: "Sinan Erdem Yan Salon" },
  { id: 5, city: "İzmir", name: "Halkapınar Spor Salonu" },
  { id: 6, city: "Ankara", name: "MEB Spor Salonu" },
  { id: 7, city: "Kocaeli", name: "Şehit Polis Recep Topaloğlu" },
];
const DEMO_TODAY_MATCHES: DemoMatch[] = [
  { id: 1, time: "10:00", city: "Bursa", venue: "Nilüfer Spor Salonu", home: "FİNAL SPOR U14", away: "TOFAŞ U14", homeTeamId: 1, awayTeamId: 2, category: "U14", competition: "Bursa U14 A Ligi", competitionType: "LEAGUE", countsForStandings: true, countsForSeasonStats: true },
  { id: 2, time: "12:00", city: "Bursa", venue: "Nilüfer Spor Salonu", home: "GEMLİK U14", away: "BURSA BASKET U14", homeTeamId: 3, awayTeamId: 4, category: "U14", competition: "Bursa U14 A Ligi", competitionType: "LEAGUE", countsForStandings: true, countsForSeasonStats: true },
  { id: 3, time: "14:00", city: "Bursa", venue: "Tofaş Spor Salonu", home: "TOFAŞ U16", away: "FİNAL SPOR U16", homeTeamId: 5, awayTeamId: 6, category: "U16", competition: "Bursa U16 A Ligi", competitionType: "LEAGUE", countsForStandings: true, countsForSeasonStats: true },
  { id: 4, time: "11:00", city: "İstanbul", venue: "Sinan Erdem Yan Salon", home: "İSTANBUL YILDIZLAR U14", away: "BASKET AKADEMİ U14", homeTeamId: 7, awayTeamId: 8, category: "U14", competition: "İstanbul U14 A Ligi", competitionType: "LEAGUE", countsForStandings: true, countsForSeasonStats: true },
];
const HOME_PLAYERS = Array.from({ length: 26 }, (_, i) => {
  const jersey = i + 4;
  const names = ["Ahmet", "Mehmet", "Ali", "Burak", "Kerem", "Ege", "Okan", "Mert", "Can", "Tuna", "Emir", "Arda", "Kaan", "Deniz", "Efe", "Bora", "Yiğit", "Alp", "Umut", "Baran", "Doruk", "Rüzgar", "Toprak", "Berk", "Eren", "Sarp"];
  return `#${jersey} ${names[i]}`;
});
const AWAY_PLAYERS = Array.from({ length: 30 }, (_, i) => {
  const jersey = i + 4;
  const names = ["Ali", "Efe", "Mert", "Can", "Deniz", "Kaan", "Aras", "Bora", "Eren", "Yiğit", "Alp", "Ozan", "Emirhan", "Taha", "Miraç", "Kutay", "Atlas", "Arda", "Çağan", "Koray", "Rıza", "Salih", "Onur", "Talha", "Yaman", "Poyraz", "Mete", "Eymen", "Akın", "Bartu"];
  return `#${jersey} ${names[i]}`;
});
const OFFICIAL_MATCH_ROSTER_LIMIT = 12;
const SPECIAL_MATCH_ROSTER_LIMIT = 24;

export default function OperatorPage() {
  const [flowStep, setFlowStep] = useState<FlowStep>("CITY");
  const [selectedCity, setSelectedCity] = useState(DEMO_CITIES[0]);
  const [selectedVenue, setSelectedVenue] = useState(DEMO_VENUES[0].name);
  const [adminCities, setAdminCities] = useState<string[]>([]);
  const [adminVenues, setAdminVenues] = useState<DemoVenue[]>([]);
  const [adminMatches, setAdminMatches] = useState<DemoMatch[]>([]);
  const [homePlayers, setHomePlayers] = useState<PlayerOption[]>([]);
  const [awayPlayers, setAwayPlayers] = useState<PlayerOption[]>([]);
  const [queueInfo, setQueueInfo] = useState("Demo maç listesi açık.");
  const cityOptions = adminCities.length ? adminCities : DEMO_CITIES;
  const allVenuesForSelect = adminVenues.length ? adminVenues : DEMO_VENUES;
  const cityVenues = allVenuesForSelect.filter((v) => v.city === selectedCity);
  const [specialHomeName, setSpecialHomeName] = useState("FİNAL SPOR U14");
  const [specialAwayName, setSpecialAwayName] = useState("KARMA TAKIM U16");
  const [specialMatchName, setSpecialMatchName] = useState("Hazırlık Maçı");
  const [operatorMatchType, setOperatorMatchType] = useState<"FRIENDLY" | "SPECIAL_MATCH" | "TOURNAMENT">("FRIENDLY");
  const [specialCountsForSeason, setSpecialCountsForSeason] = useState(false);
  const [activeMatch, setActiveMatch] = useState<DemoMatch | null>(null);
  const [operatorSide, setOperatorSide] = useState<OperatorSide>("HOME");
  const [rosterChecked, setRosterChecked] = useState<string[]>([]);
  const [starterChecked, setStarterChecked] = useState<string[]>([]);
  const [forfeitWarning, setForfeitWarning] = useState("");
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [homeTeamFouls, setHomeTeamFouls] = useState(0);
  const [awayTeamFouls, setAwayTeamFouls] = useState(0);
  const [seconds, setSeconds] = useState(600);
  const [quarter, setQuarter] = useState(1);
  const [matchStatus, setMatchStatus] = useState<
    "live" | "finished_pending" | "finished"
  >("live");
  const [timer, setTimer] = useState<any>(null);
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [playerFouls, setPlayerFouls] = useState<Record<string, number>>({});
  const [fouledOutPlayers, setFouledOutPlayers] = useState<string[]>([]);
  const [mustSubPlayer, setMustSubPlayer] = useState<string | null>(null);
  const [feed, setFeed] = useState<string[]>([]);
  const [shotModal, setShotModal] = useState<ShotContext | null>(null);
  const [pendingShot, setPendingShot] = useState<ShotContext | null>(null);
  const [pendingFoul, setPendingFoul] = useState<string | null>(null);
  const [subOut, setSubOut] = useState<string | null>(null);
  const [online, setOnline] = useState(true);
  const [onCourt, setOnCourt] = useState<string[]>([]);
  const [bench, setBench] = useState<string[]>([]);
  const [courtTab, setCourtTab] = useState<CourtTab>("court");
  const clickTimer = useRef<any>(null);
  const clickPoints = useRef<1 | 2 | 3 | null>(null);
  const [markers, setMarkers] = useState<CourtMarker[]>([]);
  const [swapCourt, setSwapCourt] = useState(false);

  const sourceMatches = adminMatches.length ? adminMatches : DEMO_TODAY_MATCHES;
  const todaysVenueMatches = sourceMatches.filter((m) => m.city === selectedCity && m.venue === selectedVenue);
  const controlledTeamName = activeMatch ? (operatorSide === "HOME" ? activeMatch.home : activeMatch.away) : "TAKIM";
  const opponentTeamName = activeMatch ? (operatorSide === "HOME" ? activeMatch.away : activeMatch.home) : "DİĞER TAKIM";
  const canStartClock = operatorSide === "HOME";
  const isSpecialOrFriendly = activeMatch?.competitionType === "SPECIAL_MATCH" || activeMatch?.competitionType === "FRIENDLY";
  const isTournamentMatch = activeMatch?.competitionType === "TOURNAMENT";
  const matchRosterLimit = isSpecialOrFriendly ? SPECIAL_MATCH_ROSTER_LIMIT : OFFICIAL_MATCH_ROSTER_LIMIT;

  const periodLabel =
    quarter <= 4 ? `${quarter}. ÇEYREK` : `UZATMA ${quarter - 4}`;

  const foulDots = (count: number) =>
    Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < Math.min(count, 5) ? "active" : ""} />
    ));

  function resetPeriodTeamFouls() {
    setHomeTeamFouls(0);
    setAwayTeamFouls(0);
  }

  function isFouledOut(player: string) {
    return fouledOutPlayers.includes(player);
  }

  function requireFoulOutSubstitution(player: string) {
    stopClock();
    setSubOut(player);
    setMustSubPlayer(player);
    setFouledOutPlayers((prev) => Array.from(new Set([...prev, player])));
    log(`SİSTEM: ${player} 5 faul yaptı ve oyun dışı kaldı. Değişiklik yapılmadan oyun devam etmez.`);
    persistMatchState("live");
  }

  function shouldAutoStopClock(eventType: string) {
    return new Set([
      "FOUL",
      "PF",
      "FOUL_DRAWN",
      "FD",
      "FTA_MADE",
      "FTM",
      "FTA_MISS",
      "FTA",
      "AND_ONE",
      "SUBSTITUTION",
      "TIMEOUT",
    ]).has(String(eventType || "").toUpperCase());
  }

  async function persistMatchState(
    nextStatus?: "live" | "finished_pending" | "finished",
    override?: Partial<{
      quarter: number;
      seconds: number;
      homeScore: number;
      awayScore: number;
    }>,
  ) {
    try {
      await fetch("/api/match-state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          match_id: activeMatch?.id ?? 1,
          current_quarter: override?.quarter ?? quarter,
          clock_seconds: override?.seconds ?? seconds,
          home_score: override?.homeScore ?? homeScore,
          away_score: override?.awayScore ?? awayScore,
          status: nextStatus || matchStatus,
        }),
      });
    } catch (err: any) {
      log(
        `SİSTEM: maç durumu kaydedilemedi ${String(err?.message || err).slice(0, 90)}`,
      );
    }
  }

  function fmt(s: number) {
    return (
      String(Math.floor(s / 60)).padStart(2, "0") +
      ":" +
      String(s % 60).padStart(2, "0")
    );
  }

  function log(text: string) {
    setFeed((prev) => [text, ...prev].slice(0, 30));
  }

  async function postOperatorMinutes(
    action: "OPEN_STARTERS" | "OPEN_PLAYER" | "CLOSE_PLAYER" | "CLOSE_TEAM_OPEN",
    playerId?: number | null,
    override?: Partial<{ quarter: number; clockSeconds: number; gameClock: string; teamId: number }>,
  ) {
    if (!activeMatch?.id) return false;

    const clockSeconds = Number(override?.clockSeconds ?? seconds);
    const body = {
      action,
      match_id: Number(activeMatch.id),
      team_id: Number(override?.teamId ?? getControlledTeamId()),
      player_id: playerId ?? undefined,
      quarter: Number(override?.quarter ?? quarter),
      clock_seconds: clockSeconds,
      game_clock: override?.gameClock ?? fmt(clockSeconds),
    };

    try {
      const res = await fetch("/api/operator-minutes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || json?.ok === false) {
        log(`SİSTEM: süre kaydı hatası ${action} ${String(json?.error || res.statusText).slice(0, 120)}`);
        return false;
      }
      return true;
    } catch (err: any) {
      log(`SİSTEM: süre API hatası ${action} ${String(err?.message || err).slice(0, 120)}`);
      return false;
    }
  }

  async function openStarterMinuteSessions() {
    const ok = await postOperatorMinutes("OPEN_STARTERS", null, {
      quarter,
      clockSeconds: seconds,
      gameClock: fmt(seconds),
    });
    if (ok) log(`SİSTEM: ${controlledTeamName} ilk 5 süre kayıtları açıldı.`);
  }

  async function closePlayerMinuteSession(player: string, clockSeconds = seconds) {
    const playerId = getPlayerId(player);
    if (!playerId) return false;
    return postOperatorMinutes("CLOSE_PLAYER", playerId, {
      clockSeconds,
      gameClock: fmt(clockSeconds),
    });
  }

  async function openPlayerMinuteSession(player: string, nextQuarter = quarter, clockSeconds = seconds) {
    const playerId = getPlayerId(player);
    if (!playerId) return false;
    return postOperatorMinutes("OPEN_PLAYER", playerId, {
      quarter: nextQuarter,
      clockSeconds,
      gameClock: fmt(clockSeconds),
    });
  }

  async function closeTeamOpenMinuteSessions(clockSeconds = seconds) {
    const ok = await postOperatorMinutes("CLOSE_TEAM_OPEN", null, {
      clockSeconds,
      gameClock: fmt(clockSeconds),
    });
    if (ok) log(`SİSTEM: ${controlledTeamName} açık süre kayıtları kapatıldı.`);
    return ok;
  }

  async function closeOnCourtMinuteSessions(clockSeconds = seconds) {
    await closeTeamOpenMinuteSessions(clockSeconds);
  }

  async function openOnCourtMinuteSessions(nextQuarter: number, clockSeconds: number) {
    await Promise.all(onCourt.map((player) => openPlayerMinuteSession(player, nextQuarter, clockSeconds)));
  }

  function startClock() {
    if (!canStartClock) {
      log("SİSTEM: süreyi sadece ev sahibi operatörü başlatabilir.");
      return;
    }
    if (mustSubPlayer) {
      log(`SİSTEM: ${mustSubPlayer} 5 faul nedeniyle oyundan çıkmalı. Önce değişiklik yap.`);
      return;
    }
    if (timer || matchStatus === "finished") return;
    const t = setInterval(() => {
      setSeconds((s) => Math.max(0, s - 1));
    }, 1000);
    setTimer(t);
  }

  function stopClock() {
    if (timer) clearInterval(timer);
    setTimer(null);
  }

  useEffect(() => {
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [timer]);

  useEffect(() => {
    if (seconds > 0) {
      if (timer && seconds % 5 === 0) persistMatchState("live");
      return;
    }

    stopClock();

    if (quarter < 4) {
      const nextQuarter = quarter + 1;
      closeOnCourtMinuteSessions(0);
      setTimeout(() => openOnCourtMinuteSessions(nextQuarter, 600), 0);
      setQuarter(nextQuarter);
      if (nextQuarter === 3) setSwapCourt(true);
      setSeconds(600);
      resetPeriodTeamFouls();
      log(
        `SİSTEM: ${quarter}. periyot bitti, ${nextQuarter}. periyot 10:00 hazır. Başlatmak için ▶ bas.`,
      );
      persistMatchState("live", { quarter: nextQuarter, seconds: 600 });
      return;
    }

    if (homeScore === awayScore) {
      const nextQuarter = quarter + 1;
      closeOnCourtMinuteSessions(0);
      setTimeout(() => openOnCourtMinuteSessions(nextQuarter, 300), 0);
      setQuarter(nextQuarter);
      setSeconds(300);
      resetPeriodTeamFouls();
      log(
        `SİSTEM: skor eşit, UZATMA ${nextQuarter - 4} 05:00 hazır. Başlatmak için ▶ bas.`,
      );
      persistMatchState("live", { quarter: nextQuarter, seconds: 300 });
      return;
    }

    closeOnCourtMinuteSessions(0);
    setMatchStatus("finished_pending");
    log("SİSTEM: maç bitti. 1 dakika düzeltme süresi başladı.");
    persistMatchState("finished_pending", { seconds: 0 });

    const finishTimer = setTimeout(() => {
      setMatchStatus("finished");
      log("SİSTEM: maç kesin kaydedildi ve kilitlendi.");
      persistMatchState("finished", { seconds: 0 });
    }, 60000);

    return () => clearTimeout(finishTimer);
  }, [seconds]);

  function getPlayerId(player: string) {
    const allPlayers = [...homePlayers, ...awayPlayers];
    return allPlayers.find((p) => p.label === player)?.id ?? null;
  }

  function getSidePlayerLabels(side: OperatorSide = operatorSide) {
    const list = side === "HOME" ? homePlayers : awayPlayers;
    return list.map((p) => p.label);
  }

  function resetRosterForSide(side: OperatorSide) {
    const labels = getSidePlayerLabels(side);
    const initialRoster = labels.slice(0, Math.min(8, matchRosterLimit));

    // V2.1.26H-4C: İlk 5 artık otomatik seçilmez.
    // Operatör STARTERS ekranında tam 5 oyuncuyu manuel seçer.
    setRosterChecked(initialRoster);
    setStarterChecked([]);
    setSelectedPlayer(initialRoster[0] || "");
    setForfeitWarning(labels.length ? "" : "Bu takım için oyuncu bulunamadı. Mini Admin / Veri Yönetimi ekranından oyuncu ekleyin.");
  }

  function getControlledTeamId() {
    if (!activeMatch) return operatorSide === "HOME" ? 1 : 2;
    return Number(operatorSide === "HOME" ? activeMatch.homeTeamId : activeMatch.awayTeamId) || (operatorSide === "HOME" ? 1 : 2);
  }

  function statRequiresPlayer(eventType: string) {
    const dbType = normalizeEventTypeForDb(eventType);
    return new Set([
      "2PA_MADE",
      "2PA_MISS",
      "3PA_MADE",
      "3PA_MISS",
      "FTA_MADE",
      "FTA_MISS",
      "AST",
      "OREB",
      "DREB",
      "STL",
      "BLK",
      "BLK_AGAINST",
      "TOV",
      "FOUL",
      "FOUL_DRAWN",
    ]).has(dbType);
  }

  function validatePlayerForStat(eventType: string, player: string, payload: Record<string, any> = {}) {
    const dbType = normalizeEventTypeForDb(eventType);
    if (!statRequiresPlayer(dbType)) return true;

    const playerId = payload.player_id ?? getPlayerId(player);
    if (!player || player === "YOK" || player === "PENDING" || !playerId) {
      log(`SİSTEM: ${dbType} kaydedilemedi. Önce geçerli oyuncu seçiniz.`);
      return false;
    }

    // Oyuncu doğrulamada asıl şart: geçerli player_id bulunmasıdır.
    // Not: onCourt listesi bazen oyuncu etiketiyle birebir eşleşmediği için
    // seçili oyuncu varken hatalı “oyuncu seçiniz” uyarısı verebiliyordu.
    // Bu nedenle FOUL_DRAWN / FOUL / şut / asist gibi kayıtlar için
    // oyuncu ID'si varsa kayıt yapılmasına izin veriyoruz. Süre ve sahada olma
    // hesabı ayrı olarak match_rosters + substitutions üzerinden yapılır.

    if (isFouledOut(player)) {
      log(`SİSTEM: ${player} 5 faul nedeniyle istatistik alamaz.`);
      return false;
    }

    return true;
  }

  async function saveRosterToDb(nextStarters: string[] = starterChecked) {
    if (!activeMatch) return;
    const payload = {
      match_id: activeMatch.id,
      team_id: getControlledTeamId(),
      operator_side: operatorSide,
      roster_type: isSpecialOrFriendly ? "SPECIAL_MATCH" : isTournamentMatch ? "TOURNAMENT" : "OFFICIAL",
      is_special_match: isSpecialOrFriendly,
      players: rosterChecked.map((player) => ({
        player_id: getPlayerId(player),
        player_label: player,
        jersey_no: Number(player.match(/#(\d+)/)?.[1] || 0) || null,
        is_starter: nextStarters.includes(player),
        is_on_court: nextStarters.includes(player),
      })),
    };

    try {
      const res = await fetch("/api/match-rosters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || json?.ok === false) {
        log(`SİSTEM: kadro Supabase kayıt hatası ${String(json?.error || res.statusText).slice(0, 120)}`);
        return;
      }
      log(`SİSTEM: ${controlledTeamName} maç kadrosu Supabase'e kaydedildi (${json?.count || rosterChecked.length} oyuncu).`);
    } catch (err: any) {
      log(`SİSTEM: kadro kayıt API hatası ${String(err?.message || err).slice(0, 120)}`);
    }
  }

  async function saveSubstitutionToDb(playerOut: string, playerIn: string) {
    if (!activeMatch) return;
    const payload = {
      match_id: activeMatch.id,
      team_id: getControlledTeamId(),
      player_out_id: getPlayerId(playerOut),
      player_in_id: getPlayerId(playerIn),
      player_out_label: playerOut,
      player_in_label: playerIn,
      quarter,
      game_clock: fmt(seconds),
      operator_side: operatorSide,
    };

    try {
      const res = await fetch("/api/substitutions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || json?.ok === false) {
        log(`SİSTEM: değişiklik Supabase kayıt hatası ${String(json?.error || res.statusText).slice(0, 120)}`);
        return;
      }
      log(`SİSTEM: değişiklik Supabase'e kaydedildi. ${playerOut} OUT / ${playerIn} IN`);
    } catch (err: any) {
      log(`SİSTEM: değişiklik API hatası ${String(err?.message || err).slice(0, 120)}`);
    }
  }

  function normalizeEventTypeForDb(type: string) {
    const raw = String(type || "")
      .trim()
      .toUpperCase();
    const map: Record<string, string> = {
      "2PM": "2PA_MADE",
      "2PA": "2PA_MISS",
      "2PA_MADE": "2PA_MADE",
      "2PA_MISS": "2PA_MISS",
      "3PM": "3PA_MADE",
      "3PA": "3PA_MISS",
      "3PA_MADE": "3PA_MADE",
      "3PA_MISS": "3PA_MISS",
      FTM: "FTA_MADE",
      FTA: "FTA_MISS",
      FTA_MADE: "FTA_MADE",
      FTA_MISS: "FTA_MISS",
      PF: "FOUL",
      FOUL: "FOUL",
      FD: "FOUL_DRAWN",
      FOUL_DRAWN: "FOUL_DRAWN",
      BY: "BLK_AGAINST",
      BLOCKED: "BLK_AGAINST",
      BLK_AGAINST: "BLK_AGAINST",
      BLK: "BLK",
      AST: "AST",
      OREB: "OREB",
      DREB: "DREB",
      STL: "STL",
      TOV: "TOV",
      TIMEOUT: "TIMEOUT",
      SUBSTITUTION: "SUBSTITUTION",
    };
    return map[raw] || raw;
  }

  function addQueue(
    type: string,
    player: string,
    payload: Record<string, any> = {},
  ) {
    const dbType = normalizeEventTypeForDb(type);
    const playerId = payload.player_id ?? getPlayerId(player);

    if (!validatePlayerForStat(dbType, player, { ...payload, player_id: playerId })) {
      return;
    }

    const event = {
      event_id: createEventId(),
      type: dbType,
      player,
      status: online ? ("ready" as const) : ("queued" as const),
      payload: { ...payload, player_id: playerId },
    };

    enqueue(event);

    if (dbType === "FOUL") {
      const teamId = Number(payload.team_id ?? 1);
      if (teamId === 2) setAwayTeamFouls((v) => Math.min(5, v + 1));
      else setHomeTeamFouls((v) => Math.min(5, v + 1));

      setPlayerFouls((prev) => {
        const nextCount = Number(prev[player] || 0) + 1;
        const next = { ...prev, [player]: nextCount };
        if (nextCount >= 5) {
          setTimeout(() => requireFoulOutSubstitution(player), 0);
        } else {
          log(`SİSTEM: ${player} faul sayısı ${nextCount}/5.`);
        }
        return next;
      });
    }

    if (shouldAutoStopClock(dbType)) {
      stopClock();
      log(`SİSTEM: ${dbType} nedeniyle süre otomatik durdu. Devam için ▶ bas.`);
      persistMatchState("live");
    }

    // Online modda olayları Supabase'e yazan Next.js API route'una gönderir.
    // Demo sabitleri 003_demo_match_data.sql ile oluşturulan test maçına bağlıdır.
    if (online) {
      const apiPayload = {
        client_event_id: event.event_id,
        event_type: dbType,
        // V2.1.18: her online olay zorunlu olarak API'ye gider.
        // API demo-no-db cevabı verirse artık başarı sayılmaz; ekranda görünür hata yazar.
        match_id: Number(payload.match_id ?? activeMatch?.id ?? 1),
        team_id: Number(payload.team_id ?? getControlledTeamId()),
        player_id: playerId ?? null,
        related_player_id:
          payload.related_player_id ??
          (payload.related_player
            ? getPlayerId(payload.related_player)
            : null),
        quarter: Number(payload.quarter ?? quarter ?? 1),
        game_clock: payload.game_clock || fmt(seconds) || "10:00",
        operator_side: operatorSide === "HOME" ? "HOME_OPERATOR" : "AWAY_OPERATOR",
        sync_source: "OPERATOR_WEB",
        client_created_at: new Date().toISOString(),
        linked_basket_id: payload.linked_basket_id,
        event_tags: payload.tags?.join?.("-") || payload.event_tags,
        notes: JSON.stringify({ player_label: player, ...payload }),
      };

      fetch("/api/match-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify(apiPayload),
      })
        .then(async (res) => {
          const rawText = await res.text();
          let json: any = null;
          try {
            json = rawText ? JSON.parse(rawText) : null;
          } catch {
            json = null;
          }

          if (!res.ok || json?.ok === false || json?.mode === "demo-no-db") {
            console.error(
              "NONSTOP Supabase kayıt hatası:",
              rawText,
              apiPayload,
            );
            log(
              `SİSTEM: Supabase kayıt hatası (${dbType}) ${String(json?.error || rawText || res.statusText).slice(0, 140)}`,
            );
            return;
          }

          markSynced();
          const insertedId = json?.data?.id ? ` id:${json.data.id}` : "";
          log(`SİSTEM: Supabase kayıt OK (${dbType})${insertedId}`);
        })
        .catch((err) => {
          console.error("NONSTOP API bağlantı hatası:", err, apiPayload);
          log(
            `SİSTEM: API bağlantı hatası (${dbType}) ${String(err?.message || err).slice(0, 120)}`,
          );
        });
    }
  }

  async function syncNow() {
    markSynced();
    log("SİSTEM: offline kuyruk senkronize edildi");
  }

  function toggleOnline() {
    const next = !online;
    setOnline(next);
    if (next) syncNow();
  }

  function eventOnly(type: string) {
    if (matchStatus === "finished") {
      log("SİSTEM: maç kilitli, yeni istatistik girilemez.");
      return;
    }
    if (!validatePlayerForStat(type, selectedPlayer)) {
      return;
    }
    addQueue(type, selectedPlayer);
    log(`${fmt(seconds)} ${selectedPlayer} ${type}`);
  }

  function startShot(points: 1 | 2 | 3, made: boolean) {
    if (matchStatus === "finished") {
      log("SİSTEM: maç kilitli, şut girilemez.");
      return;
    }
    const shotType = points === 1 ? (made ? "FTA_MADE" : "FTA_MISS") : points === 2 ? (made ? "2PA_MADE" : "2PA_MISS") : (made ? "3PA_MADE" : "3PA_MISS");
    if (!validatePlayerForStat(shotType, selectedPlayer)) {
      return;
    }
    const ctx: ShotContext = {
      linked_basket_id: createLinkedBasketId(),
      player: selectedPlayer,
      points,
      made,
      assist: points === 1 ? "YOK" : "PENDING",
      foul: points === 1 ? "YOK" : "PENDING",
      tags: [],
    };

    if (made) setHomeScore((s) => s + points);

    if (points === 1) {
      stopClock();
      log("SİSTEM: serbest atış / +1 için süre durdu. Şut yerini sahadan işaretle.");
      setPendingShot(ctx);
      return;
    }

    if (made) setShotModal(ctx);
    else setPendingShot(ctx);
  }

  function handleStatClick(points: 1 | 2 | 3) {
    // Tek tık: 1 saniye bekler, ikinci tık gelmezse isabetsiz atış.
    // Aynı butona ikinci tık 1 saniye içinde gelirse sayı olarak kaydeder.
    if (clickTimer.current && clickPoints.current === points) {
      clearTimeout(clickTimer.current);
      clickTimer.current = null;
      clickPoints.current = null;
      startShot(points, true);
      return;
    }

    if (clickTimer.current && clickPoints.current !== points) {
      clearTimeout(clickTimer.current);
      const previousPoints = clickPoints.current;
      clickTimer.current = null;
      clickPoints.current = null;
      if (previousPoints) startShot(previousPoints, false);
    }

    clickPoints.current = points;
    clickTimer.current = setTimeout(() => {
      clickTimer.current = null;
      clickPoints.current = null;
      startShot(points, false);
    }, 1000);
  }

  function setAssist(player: string | null) {
    setShotModal((m) => {
      if (!m) return m;
      const tags = player
        ? Array.from(new Set([...m.tags, "AB"]))
        : m.tags.filter((t) => t !== "AB");
      return { ...m, assist: player || "YOK", tags };
    });
  }

  function setFoul(player: string | null) {
    setShotModal((m) => {
      if (!m) return m;
      const tags = player
        ? Array.from(new Set([...m.tags, "FA"]))
        : m.tags.filter((t) => t !== "FA");
      return { ...m, foul: player || "YOK", tags };
    });
  }

  function saveShot(context: ShotContext, shot?: { x: number; y: number }) {
    const isFreeThrow = context.points === 1;
    const type = isFreeThrow
      ? context.made
        ? "FTA_MADE"
        : "FTA_MISS"
      : context.points === 2
        ? context.made
          ? "2PA_MADE"
          : "2PA_MISS"
        : context.made
          ? "3PA_MADE"
          : "3PA_MISS";
    const tag = context.tags.length
      ? context.tags.join("-")
      : context.made
        ? "SAYI"
        : "İSABETSİZ";

    addQueue(type, context.player, {
      ...context,
      linked_basket_id: context.linked_basket_id,
      shot_x: shot?.x,
      shot_y: shot?.y,
      made: context.made,
      tags: context.tags,
    });

    log(
      `${fmt(seconds)} ${context.player} ${type} ${tag}${shot ? ` (${shot.x.toFixed(0)}%, ${shot.y.toFixed(0)}%)` : ""}`,
    );

    if (context.made && quarter >= 4 && seconds <= 120) {
      stopClock();
      log("SİSTEM: 4. çeyrek son 2 dk sayı oldu, süre durdu. Devam için ▶ bas.");
      persistMatchState("live");
    }

    if (
      context.made &&
      context.assist &&
      context.assist !== "YOK" &&
      context.assist !== "PENDING"
    ) {
      addQueue("AST", context.assist, {
        linked_basket_id: context.linked_basket_id,
        assist: context.assist,
        related_player_id: getPlayerId(context.player),
      });
      log(`${fmt(seconds)} ${context.assist} AST`);
    }

    if (
      context.made &&
      context.foul &&
      context.foul !== "YOK" &&
      context.foul !== "PENDING"
    ) {
      addQueue("FOUL_DRAWN", context.player, {
        linked_basket_id: context.linked_basket_id,
        drawn_by: context.player,
        allow_off_court: true,
      });
      addQueue("FOUL", context.foul, {
        linked_basket_id: context.linked_basket_id,
        committed_by: context.foul,
        allow_off_court: true,
      });
      log(`${fmt(seconds)} ${context.player} FOUL_DRAWN`);
      log(`${fmt(seconds)} ${context.foul} FOUL`);
    }
  }

  function saveShotWithoutLocation() {
    if (!shotModal) return;
    saveShot(shotModal);
    setShotModal(null);
  }

  function startShotPick() {
    if (!shotModal) return;
    setPendingShot(shotModal);
    setShotModal(null);
  }

  function startFoulPick(type: string) {
    if (!validatePlayerForStat(type, selectedPlayer)) {
      return;
    }
    stopClock();
    log("SİSTEM: faul seçimi için süre durdu. Devam için ▶ bas.");
    setPendingShot(null);
    setPendingFoul(type);
    setCourtTab("fouls");
  }

  function handleCourtClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    let x = ((e.clientX - rect.left) / rect.width) * 100;
    let y = ((e.clientY - rect.top) / rect.height) * 100;

    if (swapCourt) {
      x = 100 - x;
    }

    if (pendingFoul) {
      const type = pendingFoul;
      setMarkers((prev) => [
        { id: createEventId(), x, y, label: type, made: false, kind: "foul" },
        ...prev,
      ]);
      addQueue(type, selectedPlayer, { foul_x: x, foul_y: y });
      log(
        `${fmt(seconds)} ${selectedPlayer} ${type} (${x.toFixed(0)}%, ${y.toFixed(0)}%)`,
      );
      setPendingFoul(null);
      return;
    }

    if (!pendingShot) return;
    const label =
      pendingShot.points === 1
        ? pendingShot.made
          ? "FT✓"
          : "FT×"
        : `${pendingShot.points}P${pendingShot.made ? "✓" : "×"}`;
    setMarkers((prev) => [
      {
        id: createEventId(),
        x,
        y,
        label,
        made: pendingShot.made,
        kind: "shot",
      },
      ...prev,
    ]);
    saveShot(pendingShot, { x, y });
    setPendingShot(null);
  }

  function beginSubstitution(playerOut: string) {
    stopClock();
    setSubOut(playerOut);
    log(`SİSTEM: oyuncu değişikliği başladı, süre durdu. ${playerOut} için yedekten oyuncu seç. Devam için ▶ basılacak.`);
    persistMatchState("live");
  }

  async function saveSub(playerIn: string) {
    if (!subOut) return;

    const playerOut = subOut;
    if (playerIn === playerOut) return;
    if (isFouledOut(playerIn)) {
      log(`SİSTEM: ${playerIn} 5 faul nedeniyle oyuna giremez.`);
      return;
    }

    // Oyuncu değişikliği sadece olay kaydı değil, ekrandaki kadroyu da günceller.
    // Çıkan oyuncu sahadan yedeklere, giren oyuncu yedekten sahaya taşınır.
    setOnCourt((prev) => {
      const replaced = prev.map((p) => (p === playerOut ? playerIn : p));
      return Array.from(new Set(replaced)).slice(0, 5);
    });

    setBench((prev) => {
      const withoutIncoming = prev.filter(
        (p) => p !== playerIn && p !== playerOut,
      );
      return [...withoutIncoming, playerOut];
    });

    setSelectedPlayer(playerIn);
    if (mustSubPlayer === playerOut) setMustSubPlayer(null);
    stopClock();
    log("SİSTEM: oyuncu değişikliği için süre durdu. Devam için ▶ bas.");
    addQueue("SUBSTITUTION", playerOut, {
      match_id: activeMatch?.id,
      team_id: getControlledTeamId(),
      player_out: playerOut,
      player_in: playerIn,
      related_player_id: getPlayerId(playerIn),
    });
    await closePlayerMinuteSession(playerOut);
    await openPlayerMinuteSession(playerIn);
    saveSubstitutionToDb(playerOut, playerIn);
    log(`${fmt(seconds)} DEĞİŞİKLİK: ${playerOut} OUT / ${playerIn} IN`);
    setSubOut(null);
  }

  const visibleMarkers = markers.filter(
    (m) =>
      courtTab === "court" ||
      courtTab === "heat" ||
      (courtTab === "shots" && m.kind === "shot") ||
      (courtTab === "fouls" && m.kind === "foul"),
  );


  useEffect(() => {
    let cancelled = false;
    async function loadOperatorQueue() {
      try {
        const params = new URLSearchParams();
        if (selectedCity) params.set("city", selectedCity);
        if (selectedVenue) params.set("venue", selectedVenue);
        const res = await fetch(`/api/operator-queue?${params.toString()}`, { cache: "no-store" });
        const json = await res.json();
        if (cancelled || !json?.ok) return;
        const apiCities = (json.cities || []).map((c: any) => String(c.name || "")).filter(Boolean);
        const apiVenues = (json.venues || []).map((v: any) => ({ id: Number(v.id), city: String(v.city || ""), name: String(v.name || "") })).filter((v: DemoVenue) => v.city && v.name);
        const apiMatches = (json.matches || []).map((m: any) => ({
          id: Number(m.id),
          time: String(m.time || "Saat yok"),
          city: String(m.city || ""),
          venue: String(m.venue || ""),
          home: String(m.home || "Ev Sahibi"),
          away: String(m.away || "Misafir"),
          homeTeamId: Number(m.homeTeamId || m.home_team_id || 0) || null,
          awayTeamId: Number(m.awayTeamId || m.away_team_id || 0) || null,
          category: String(m.category || "-"),
          competition: String(m.competition || "Resmi Maç"),
          competitionType: (m.competitionType || "LEAGUE") as DemoMatch["competitionType"],
          countsForStandings: m.countsForStandings ?? true,
          countsForSeasonStats: m.countsForSeasonStats ?? true,
        })).filter((m: DemoMatch) => m.city && m.venue);
        setAdminCities(apiCities);
        setAdminVenues(apiVenues);
        setAdminMatches(apiMatches);
        setQueueInfo(apiMatches.length ? "Mini Admin maçları yüklendi." : "Bugün seçili salonda Mini Admin maçı yok. Demo liste açık olabilir.");
      } catch (err: any) {
        setQueueInfo(`Mini Admin maçları alınamadı: ${String(err?.message || err).slice(0, 80)}`);
      }
    }
    loadOperatorQueue();
    return () => { cancelled = true; };
  }, [selectedCity, selectedVenue]);

  useEffect(() => {
    let cancelled = false;
    async function loadMatchPlayers() {
      if (!activeMatch?.homeTeamId || !activeMatch?.awayTeamId) return;
      try {
        const params = new URLSearchParams({
          home_team_id: String(activeMatch.homeTeamId),
          away_team_id: String(activeMatch.awayTeamId),
        });
        const res = await fetch(`/api/operator-team-players?${params.toString()}`, { cache: "no-store" });
        const json = await res.json().catch(() => null);
        if (cancelled || !json?.ok) {
          if (!cancelled) log(`SİSTEM: oyuncular alınamadı ${String(json?.error || res.statusText).slice(0, 100)}`);
          return;
        }
        const nextHome = (json.homePlayers || []) as PlayerOption[];
        const nextAway = (json.awayPlayers || []) as PlayerOption[];
        setHomePlayers(nextHome);
        setAwayPlayers(nextAway);
      } catch (err: any) {
        if (!cancelled) log(`SİSTEM: oyuncu API hatası ${String(err?.message || err).slice(0, 100)}`);
      }
    }
    loadMatchPlayers();
    return () => { cancelled = true; };
  }, [activeMatch?.id, activeMatch?.homeTeamId, activeMatch?.awayTeamId]);

  useEffect(() => {
    if (!activeMatch) return;
    const labels = getSidePlayerLabels(operatorSide);
    if (!labels.length) return;

    // V2.1.26H-4C: Takım listesi/maç kadrosu hazır gelir,
    // fakat ilk 5 otomatik seçilmez. İlk 5'i operatör elle belirler.
    setRosterChecked(labels.slice(0, Math.min(8, matchRosterLimit)));
    setStarterChecked([]);
    setSelectedPlayer(labels[0] || "");
  }, [activeMatch?.id, operatorSide, homePlayers.length, awayPlayers.length]);

  function toggleRosterPlayer(player: string) {
    setRosterChecked((prev) => {
      if (prev.includes(player)) {
        setStarterChecked((starters) => starters.filter((p) => p !== player));
        return prev.filter((p) => p !== player);
      }
      if (prev.length >= matchRosterLimit) {
        setForfeitWarning(`${isSpecialOrFriendly ? "Özel/hazırlık maçında" : "Resmi maçta"} maç kadrosu en fazla ${matchRosterLimit} oyuncu olabilir.`);
        return prev;
      }
      setForfeitWarning("");
      return [...prev, player];
    });
  }

  function toggleStarter(player: string) {
    if (!rosterChecked.includes(player)) return;
    setStarterChecked((prev) => {
      if (prev.includes(player)) return prev.filter((p) => p !== player);
      if (prev.length >= 5) return prev;
      return [...prev, player];
    });
  }


  function createSpecialMatch() {
    const home = specialHomeName.trim() || "EV SAHİBİ";
    const away = specialAwayName.trim() || "MİSAFİR / KARMA";
    const specialMatch: DemoMatch = {
      id: 9000 + Date.now(),
      time: "Özel",
      city: selectedCity,
      venue: selectedVenue,
      home,
      away,
      homeTeamId: null,
      awayTeamId: null,
      category: "SERBEST",
      competition: specialMatchName.trim() || (operatorMatchType === "TOURNAMENT" ? "Turnuva Maçı" : "Özel / Hazırlık Maçı"),
      competitionType: operatorMatchType,
      countsForStandings: operatorMatchType === "TOURNAMENT",
      countsForSeasonStats: false,
    };
    setActiveMatch(specialMatch);
    setOperatorSide("HOME");
    setRosterChecked([]);
    setStarterChecked([]);
    setSelectedPlayer("");
    setForfeitWarning("");
    setFlowStep("ROSTER");
  }

  async function confirmStarters() {
    if (starterChecked.length !== 5) {
      setForfeitWarning(`${controlledTeamName} için tam 5 oyuncu seçmelisin. İlk 5 otomatik seçilmez.`);
      return;
    }
    await saveRosterToDb(starterChecked.slice(0, 5));
    await closeTeamOpenMinuteSessions(seconds);
    await openStarterMinuteSessions();
    setOnCourt(starterChecked.slice(0, 5));
    setBench(rosterChecked.filter((p) => !starterChecked.includes(p)));
    setSelectedPlayer(starterChecked[0]);
    setFlowStep("GAME");
    log(`SİSTEM: ${controlledTeamName} ilk 5 onaylandı. ${operatorSide === "HOME" ? "Süre başlatma yetkisi sende." : "Süreyi ev sahibi operatörü başlatacak."}`);
  }

  if (flowStep !== "GAME") {
    const sidePlayers = getSidePlayerLabels(operatorSide);
    return (
      <main className="nn-container" style={{ maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '2rem' }}>
        <div className="nn-header-area">
          <h1 className="nn-title" style={{ textAlign: 'center' }}>NONSTOP Operatör Akışı</h1>
          <p className="nn-subtitle" style={{ textAlign: 'center' }}>İl seç → salon seç → bugünkü maç veya özel maç → görev tarafı → maç kadrosu → ilk 5 → maç ekranı</p>
        </div>

        <div className="nn-card">
          {flowStep === "CITY" && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h2 style={{ fontSize: '1.5rem', color: '#fff', borderBottom: '1px solid var(--nn-border)', paddingBottom: '0.5rem' }}>1. İl Seç</h2>
              <p style={{ color: 'var(--nn-text-muted)' }}>Önce il seçilir. Böylece yüzlerce salon içinde karışıklık olmaz.</p>
              <div className="nn-form-group">
                <label className="nn-form-label">Şehir Seçimi</label>
                <select className="nn-select" value={selectedCity} onChange={(e) => {
                  const nextCity = e.target.value;
                  setSelectedCity(nextCity);
                  const firstVenue = allVenuesForSelect.find((v) => v.city === nextCity)?.name || "";
                  setSelectedVenue(firstVenue);
                }}>
                  {cityOptions.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <button className="nn-button nn-button-primary" style={{ alignSelf: 'flex-start', marginTop: '1rem' }} onClick={() => setFlowStep("VENUE")}>Salon Seçimine Geç &rarr;</button>
            </div>
          )}

          {flowStep === "VENUE" && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h2 style={{ fontSize: '1.5rem', color: '#fff', borderBottom: '1px solid var(--nn-border)', paddingBottom: '0.5rem' }}>2. Salon Seç</h2>
              <p style={{ color: 'var(--nn-text-muted)' }}>Seçili il: <b style={{ color: 'var(--nn-cyan)' }}>{selectedCity}</b></p>
              <div className="nn-form-group">
                <label className="nn-form-label">Salon Seçimi</label>
                <select className="nn-select" value={selectedVenue} onChange={(e) => setSelectedVenue(e.target.value)}>
                  {cityVenues.map((v) => <option key={v.id}>{v.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button className="nn-button nn-button-primary" onClick={() => setFlowStep("MATCH")}>Bugünkü Maçları Getir &rarr;</button>
                <button className="nn-button" style={{ background: 'transparent' }} onClick={() => setFlowStep("CITY")}>&larr; İl Seçimine Dön</button>
              </div>
            </div>
          )}

          {flowStep === "MATCH" && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h2 style={{ fontSize: '1.5rem', color: '#fff', borderBottom: '1px solid var(--nn-border)', paddingBottom: '0.5rem' }}>3. Bugünkü Maç Sırası</h2>
              <p style={{ color: 'var(--nn-cyan)' }}>{queueInfo}</p>
              {todaysVenueMatches.length === 0 ? <div style={{ padding: '1rem', background: 'rgba(239,68,68,0.1)', color: '#fca5a5', border: '1px solid #ef4444', borderRadius: '8px' }}>Bu salon için bugün maç bulunamadı. Mini Admin’den maç oluşturduktan sonra tekrar deneyin.</div> : null}
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginTop: '1rem' }}>
                {todaysVenueMatches.map((m, index) => (
                  <button key={m.id} className="nn-button" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '1rem', height: 'auto', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--nn-border)' }} onClick={() => { setActiveMatch(m); setRosterChecked([]); setStarterChecked([]); setSelectedPlayer(""); setFlowStep("ROSTER"); }}>
                    <b style={{ color: 'var(--nn-cyan)', marginBottom: '0.25rem' }}>{index + 1}. Maç • {m.time}</b>
                    <span style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '0.25rem' }}>{m.home} - {m.away}</span>
                    <small style={{ color: 'var(--nn-text-muted)' }}>{m.competition}</small>
                  </button>
                ))}
              </div>

              <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--nn-border)' }}>
                <h3 style={{ fontSize: '1.25rem', color: 'var(--nn-orange)', marginBottom: '0.5rem' }}>Supervisor Özel / Hazırlık Maçı</h3>
                <p style={{ color: 'var(--nn-text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>U14 - U16, karma takım veya resmi fikstüre girmeyen maçlar için. Bu maç lig puan durumuna işlemez; kendi içinde istatistik ve şut haritası tutar.</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div className="nn-form-group">
                    <label className="nn-form-label">Maç türü</label>
                    <select className="nn-select" value={operatorMatchType} onChange={(e) => setOperatorMatchType(e.target.value as any)}><option value="FRIENDLY">Hazırlık Maçı</option><option value="SPECIAL_MATCH">Özel Maç</option><option value="TOURNAMENT">Turnuva Maçı</option></select>
                  </div>
                  <div className="nn-form-group">
                    <label className="nn-form-label">Maç adı</label>
                    <input className="nn-input" value={specialMatchName} onChange={(e) => setSpecialMatchName(e.target.value)} />
                  </div>
                  <div className="nn-form-group">
                    <label className="nn-form-label">1. Takım</label>
                    <input className="nn-input" value={specialHomeName} onChange={(e) => setSpecialHomeName(e.target.value)} />
                  </div>
                  <div className="nn-form-group">
                    <label className="nn-form-label">2. Takım / Karma</label>
                    <input className="nn-input" value={specialAwayName} onChange={(e) => setSpecialAwayName(e.target.value)} />
                  </div>
                </div>
                <button className="nn-button nn-button-success" onClick={createSpecialMatch}>Maçı Operatör Akışına Al</button>
              </div>
              <button className="nn-button" style={{ background: 'transparent', alignSelf: 'flex-start', marginTop: '1rem' }} onClick={() => setFlowStep("VENUE")}>&larr; Salon Seçimine Dön</button>
            </div>
          )}

          {flowStep === "ROSTER" && activeMatch && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h2 style={{ fontSize: '1.5rem', color: '#fff', borderBottom: '1px solid var(--nn-border)', paddingBottom: '0.5rem' }}>4. Operatör Tarafı ve Maç Kadrosu</h2>
              {(activeMatch.competitionType === "SPECIAL_MATCH" || activeMatch.competitionType === "FRIENDLY" || activeMatch.competitionType === "TOURNAMENT") ? (
                <div style={{ padding: '1rem', background: 'rgba(0, 240, 255, 0.1)', color: 'var(--nn-cyan)', border: '1px solid var(--nn-cyan)', borderRadius: '8px' }}>
                  <b style={{ color: '#fff' }}>{activeMatch.competitionType === "TOURNAMENT" ? "Turnuva Maçı" : "Özel/Hazırlık Maçı"}</b><br />
                  <span style={{ fontSize: '0.9rem' }}>{activeMatch.competitionType === "TOURNAMENT" ? "Bu maç oyuncu ve takım kartında Turnuvalar sekmesine ayrılır." : "Bu maç puan durumuna işlemez. Şut haritası, faul haritası, oyuncu ve takım maç istatistikleri kendi içinde tutulur."}</span>
                  <br /><span style={{ fontSize: '0.9rem' }}>{activeMatch.competitionType === "TOURNAMENT" ? "Turnuva kadro limiti resmi maç gibi 12 oyuncudur." : "Bu maç sezon istatistiğine işlemez. Oyuncu profilinde Özel/Hazırlık Maçları bölümünde ayrı görünür."}</span>
                </div>
              ) : null}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', margin: '1rem 0' }}>
                <button className="nn-button" style={{ display: 'flex', flexDirection: 'column', height: 'auto', padding: '1rem', border: operatorSide === "HOME" ? '2px solid var(--nn-cyan)' : '1px solid var(--nn-border)', background: operatorSide === "HOME" ? 'rgba(0,240,255,0.1)' : 'transparent' }} onClick={() => { setOperatorSide("HOME"); setTimeout(() => resetRosterForSide("HOME"), 0); }}><b style={{ color: operatorSide === "HOME" ? '#fff' : 'var(--nn-text-muted)', fontSize: '1.1rem' }}>Ev Sahibi Operatörü</b><small style={{ color: 'var(--nn-text-muted)' }}>Süreyi başlatabilir</small></button>
                <button className="nn-button" style={{ display: 'flex', flexDirection: 'column', height: 'auto', padding: '1rem', border: operatorSide === "AWAY" ? '2px solid var(--nn-cyan)' : '1px solid var(--nn-border)', background: operatorSide === "AWAY" ? 'rgba(0,240,255,0.1)' : 'transparent' }} onClick={() => { setOperatorSide("AWAY"); setTimeout(() => resetRosterForSide("AWAY"), 0); }}><b style={{ color: operatorSide === "AWAY" ? '#fff' : 'var(--nn-text-muted)', fontSize: '1.1rem' }}>Misafir Operatörü</b><small style={{ color: 'var(--nn-text-muted)' }}>Süreyi başlatamaz</small></button>
              </div>
              <h3 style={{ color: '#fff' }}>{controlledTeamName} takım listesinden maç kadrosunu seç</h3>
              <p style={{ color: 'var(--nn-text-muted)', fontSize: '0.9rem' }}>Takım listesinde <b>{sidePlayers.length}</b> oyuncu olabilir. Maç kadrosu ise <b>{rosterChecked.length}/{matchRosterLimit}</b>. Resmi maçta en fazla 12, özel/hazırlık maçında en fazla 24 oyuncu seçilebilir. En az 5 oyuncu zorunludur.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid var(--nn-border)' }}>
                {sidePlayers.map((p) => (
                  <label key={p} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: rosterChecked.includes(p) ? '#fff' : 'var(--nn-text-muted)', background: rosterChecked.includes(p) ? 'rgba(0,240,255,0.1)' : 'transparent', padding: '0.5rem', borderRadius: '4px' }}>
                    <input type="checkbox" checked={rosterChecked.includes(p)} onChange={() => toggleRosterPlayer(p)} style={{ accentColor: 'var(--nn-cyan)' }} /> {p}
                  </label>
                ))}
              </div>
              <button className="nn-button nn-button-primary" style={{ alignSelf: 'flex-start', marginTop: '1rem' }} onClick={() => {
                if (rosterChecked.length < 5) { setForfeitWarning(`${controlledTeamName} 5 oyuncu bildirmedi. Hükmen yenilgi riski var.`); return; }
                if (rosterChecked.length > matchRosterLimit) { setForfeitWarning(`Maç kadrosu en fazla ${matchRosterLimit} oyuncu olabilir.`); return; }
                setForfeitWarning(""); setFlowStep("STARTERS");
              }}>Kadro Tamam &rarr;</button>
              {forfeitWarning && <div style={{ color: '#ef4444', marginTop: '1rem' }}>{forfeitWarning}</div>}
            </div>
          )}

          {flowStep === "STARTERS" && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h2 style={{ fontSize: '1.5rem', color: '#fff', borderBottom: '1px solid var(--nn-border)', paddingBottom: '0.5rem' }}>5. İlk 5 Belirle</h2>
              <p style={{ color: 'var(--nn-text-muted)' }}>Seçilen maç kadrosundan sahaya çıkacak tam 5 oyuncu seçilmeli. Şu an: <b style={{ color: starterChecked.length === 5 ? '#22c55e' : 'var(--nn-orange)' }}>{starterChecked.length}/5</b></p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.5rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid var(--nn-border)' }}>
                {rosterChecked.map((p) => (
                  <label key={p} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: starterChecked.includes(p) ? '#fff' : 'var(--nn-text-muted)', background: starterChecked.includes(p) ? 'rgba(255,87,34,0.1)' : 'transparent', padding: '0.5rem', borderRadius: '4px' }}>
                    <input type="checkbox" checked={starterChecked.includes(p)} onChange={() => toggleStarter(p)} style={{ accentColor: 'var(--nn-orange)' }} /> {p}
                  </label>
                ))}
              </div>
              <button className="nn-button nn-button-success" style={{ alignSelf: 'flex-start', marginTop: '1rem' }} onClick={confirmStarters}>Maç Ekranına Geç &rarr;</button>
              {forfeitWarning && <div style={{ color: '#ef4444', marginTop: '1rem' }}>{forfeitWarning}</div>}
            </div>
          )}
        </div>
      </main>
    );
  }

  return (
    <div className="operator-page">
      <header className="score-header">
        <div className="team-score">
          <div>
            <span>EV SAHİBİ</span>
            <h1>{activeMatch?.home || "EV SAHİBİ"}</h1>
            <div className="team-fouls" title="Takım faulleri">
              <small>FAUL</small>
              <div className="foul-dots">{foulDots(homeTeamFouls)}</div>
            </div>
          </div>
          <b>{homeScore}</b>
        </div>
        <div className="clock-box">
          <span>{periodLabel}</span>
          <strong>{fmt(seconds)}</strong>
          <div className="clock-buttons">
            <button onClick={startClock}>▶ DEVAM ET</button>
            <button
              onClick={() => {
                stopClock();
                persistMatchState("live");
              }}
            >
              ⏸ DURDUR
            </button>
          </div>
          <small>
            Durum:{" "}
            {matchStatus === "live"
              ? "CANLI"
              : matchStatus === "finished_pending"
                ? "1 DK DÜZELTME"
                : "KİLİTLİ"}
          </small>
          <small>
            {online ? "ONLINE" : "OFFLINE"} / Queue:{" "}
            {typeof window !== "undefined"
              ? getQueue().filter((e) => e.status !== "synced").length
              : 0}
          </small>
          {activeMatch?.competitionType === "SPECIAL_MATCH" || activeMatch?.competitionType === "FRIENDLY" ? (
            <small>ÖZEL/HAZIRLIK • Puan/sezon tablosuna işlemez</small>
          ) : activeMatch?.competitionType === "TOURNAMENT" ? (
            <small>TURNUVA • Kariyerde ayrı sekmede</small>
          ) : null}
          <button onClick={toggleOnline}>
            {online ? "Offline Yap" : "Online Yap"}
          </button>
        </div>
        <div className="team-score away">
          <div>
            <span>MİSAFİR</span>
            <h1>{activeMatch?.away || "MİSAFİR"}</h1>
            <div className="team-fouls" title="Takım faulleri">
              <small>FAUL</small>
              <div className="foul-dots">{foulDots(awayTeamFouls)}</div>
            </div>
          </div>
          <b>{awayScore}</b>
        </div>
      </header>

      <section className="stat-footer">
        <div className="stat-context">
          <span>İstatistik Girişi</span>
          <b>{selectedPlayer}</b>
          <small>
            Tek tık: 1 sn bekler, isabetsiz atış • Çift tık: sayı • +1: faul
            çizgisi
          </small>
        </div>
        <div className="stat-buttons">
          <button className="shot-btn" onClick={() => handleStatClick(1)}>
            +1
          </button>
          <button className="shot-btn" onClick={() => handleStatClick(2)}>
            +2
          </button>
          <button className="shot-btn" onClick={() => handleStatClick(3)}>
            +3
          </button>
          <button onClick={() => eventOnly("OREB")}>Rib. H</button>
          <button onClick={() => eventOnly("DREB")}>Rib. S</button>
          <button onClick={() => eventOnly("STL")}>Top Çalma</button>
          <button onClick={() => eventOnly("TOV")}>Top Kaybı</button>
          <button onClick={() => startFoulPick("FOUL")}>Faul</button>
          <button onClick={() => startFoulPick("FOUL_DRAWN")}>Faul Aldı</button>
          <button onClick={() => eventOnly("BLK")}>Blok</button>
          <button onClick={() => eventOnly("BLK_AGAINST")}>Blok Yedi</button>
          <button onClick={() => eventOnly("TIMEOUT")}>Mola</button>
        </div>
      </section>

      <main className="operator-layout">
        <section className="court-area">
          <div className="court-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <button
                className={courtTab === "court" ? "active" : ""}
                onClick={() => setCourtTab("court")}
              >
                Saha
              </button>
              <button
                className={courtTab === "shots" ? "active" : ""}
                onClick={() => setCourtTab("shots")}
              >
                Şutlar
              </button>
              <button
                className={courtTab === "fouls" ? "active" : ""}
                onClick={() => setCourtTab("fouls")}
              >
                Fauller
              </button>
              <button
                className={courtTab === "heat" ? "active" : ""}
                onClick={() => setCourtTab("heat")}
              >
                Heat Map
              </button>
            </div>
            <button 
              style={{ background: swapCourt ? 'var(--nn-cyan)' : 'transparent', color: swapCourt ? '#000' : 'var(--nn-cyan)', border: '1px solid var(--nn-cyan)', padding: '0.25rem 0.75rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }} 
              onClick={() => setSwapCourt(prev => !prev)}
            >
              Saha Yönünü Çevir 🔁
            </button>
          </div>

          {(pendingShot || pendingFoul) && (
            <div className="shot-pick-banner">
              {pendingShot ? (
                <>
                  <b>{pendingShot.player}</b>{" "}
                  {pendingShot.made ? "sayı" : "isabetsiz atış"} için sahada
                  yeri tıkla.
                </>
              ) : (
                <>
                  <b>{selectedPlayer}</b> {pendingFoul} için faul yerini tıkla.
                </>
              )}
              <button
                onClick={() => {
                  setPendingShot(null);
                  setPendingFoul(null);
                }}
              >
                Vazgeç
              </button>
            </div>
          )}

          <div
            className={`court ${pendingShot || pendingFoul ? "picking-shot" : ""} ${courtTab === "heat" ? "heat-mode" : ""} ${swapCourt ? "flipped" : ""}`}
            onClick={handleCourtClick}
            style={{ transform: swapCourt ? 'scaleX(-1)' : 'none', transition: 'transform 0.5s ease-in-out' }}
          >
            <div className="half-line" />
            <div className="center-circle" />
            <div className="paint left" />
            <div className="paint right" />
            <div className="rim left" />
            <div className="rim right" />
            <div className="arc left" />
            <div className="arc right" />
            {visibleMarkers.map((m) => (
              <div
                key={m.id}
                className={`marker ${m.kind} ${m.made ? "made" : "miss"}`}
                style={{ left: `${m.x}%`, top: `${m.y}%`, transform: swapCourt ? 'scaleX(-1) translate(50%, -50%)' : 'translate(-50%, -50%)' }}
              >
                {courtTab === "heat" ? "" : m.label}
              </div>
            ))}
          </div>
        </section>

        <aside className="roster-panel">
          <div className="panel-title">
            <div>
              <h2>{controlledTeamName}</h2>
              <span>{operatorSide === "HOME" ? "Ev sahibi operatörü" : "Misafir operatörü"} / sadece kendi takımın</span>
            </div>
          </div>
          <div className="roster-block">
            <h3>Sahadakiler</h3>
            {onCourt.map((p) => (
              <div
                key={p}
                className={`player-row ${selectedPlayer === p ? "selected" : ""} ${isFouledOut(p) ? "fouled-out" : ""}`}
                onClick={() => {
                  if (isFouledOut(p)) {
                    log(`SİSTEM: ${p} 5 faul nedeniyle seçilemez.`);
                    return;
                  }
                  setSelectedPlayer(p);
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <b>{p}</b>
                  <span style={{
                    marginLeft: '0.5rem',
                    padding: '0.15rem 0.4rem',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    borderRadius: '4px',
                    color: '#fff',
                    backgroundColor: isFouledOut(p) ? '#ef4444' : (playerFouls[p] === 4 ? '#f97316' : (playerFouls[p] === 3 ? '#eab308' : '#374151')),
                    boxShadow: isFouledOut(p) ? '0 0 5px rgba(239, 68, 68, 0.5)' : 'none'
                  }}>
                    F: {playerFouls[p] || 0}/5 {isFouledOut(p) && "DIŞI"}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    beginSubstitution(p);
                  }}
                >
                  Değiş
                </button>
              </div>
            ))}
          </div>
          <div className="roster-block bench">
            <h3>Yedekler</h3>
            <div className="bench-grid">
              {bench.map((p) => (
                <button
                  key={p}
                  className={isFouledOut(p) ? "fouled-out-btn" : ""}
                  disabled={isFouledOut(p)}
                  onClick={() => {
                    if (isFouledOut(p)) {
                      log(`SİSTEM: ${p} 5 faul nedeniyle seçilemez.`);
                      return;
                    }
                    setSelectedPlayer(p);
                  }}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <span>{p} {isFouledOut(p) ? "🚫" : ""}</span>
                  <span style={{
                    padding: '0.15rem 0.4rem',
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    borderRadius: '4px',
                    color: '#fff',
                    backgroundColor: isFouledOut(p) ? '#ef4444' : (playerFouls[p] === 4 ? '#f97316' : (playerFouls[p] === 3 ? '#eab308' : '#374151')),
                  }}>F: {playerFouls[p] || 0}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="selected-player-card">
            <span>Seçili Oyuncu</span>
            <strong>{selectedPlayer}</strong>
            <small>PF: {playerFouls[selectedPlayer] || 0}/5 {isFouledOut(selectedPlayer) ? "• OYUN DIŞI" : ""}</small>
          </div>
        </aside>
      </main>

      <section className="event-feed bottom-feed">
        <h3>Son Olaylar</h3>
        <ul>
          {feed.map((f, i) => (
            <li key={i}>{f}</li>
          ))}
        </ul>
      </section>

      {shotModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <h2>
              {shotModal.player} {shotModal.points} Sayı
            </h2>
            <p>
              Çift tık sayı olarak kaydedildi. Asist / faul seç, sonra şut
              yerini sahadan işaretle.
            </p>
            <div className="decision-grid">
              <div className="decision-card">
                <h3>Asist?</h3>
                {onCourt
                  .filter((p) => p !== shotModal.player)
                  .map((p) => (
                    <button key={p} onClick={() => setAssist(p)}>
                      {p}
                    </button>
                  ))}
                <button className="none" onClick={() => setAssist(null)}>
                  YOK
                </button>
                <p>Durum: {shotModal.assist}</p>
              </div>
              <div className="decision-card">
                <h3>Faul?</h3>
                <button onClick={() => setFoul(`${opponentTeamName} #12`)}>
                  {opponentTeamName} #12 PF
                </button>
                <button onClick={() => setFoul(`${opponentTeamName} #15`)}>
                  {opponentTeamName} #15 PF
                </button>
                <button className="none" onClick={() => setFoul(null)}>
                  YOK
                </button>
                <p>Durum: {shotModal.foul}</p>
              </div>
            </div>
            <div className="modal-actions">
              <button className="primary" onClick={startShotPick}>
                Şut Yerini Seç
              </button>
              <button onClick={saveShotWithoutLocation}>Konumsuz Kaydet</button>
              <button onClick={() => setShotModal(null)}>İptal</button>
            </div>
          </div>
        </div>
      )}

      {subOut && (
        <div className="modal-backdrop">
          <div className="modal small">
            <h2>Oyuncu Değişikliği</h2>
            <p>
              Çıkan oyuncu: <b>{subOut}</b>
              {mustSubPlayer === subOut ? <><br /><b style={{ color: "#facc15" }}>5 faul nedeniyle zorunlu değişiklik</b></> : null}
            </p>
            <h3>Oyuna Girecek Oyuncu</h3>
            <div className="bench-grid">
              {bench.map((p) => (
                <button
                  key={p}
                  className={`sub-in-btn ${isFouledOut(p) ? "fouled-out-btn" : ""}`}
                  disabled={isFouledOut(p)}
                  onClick={() => saveSub(p)}
                >
                  → {p} {isFouledOut(p) ? "Giremez" : "Oyuna Gir"}
                </button>
              ))}
            </div>
            <br />
            <button onClick={() => setSubOut(null)}>İptal</button>
          </div>
        </div>
      )}
    </div>
  );
}