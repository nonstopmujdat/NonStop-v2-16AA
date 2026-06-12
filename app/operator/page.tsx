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
  status?: string | null;
  locked?: boolean | null;
};
type PlayerOption = {
  id: number;
  label: string;
  jersey_no: number | null;
  team_id: number;
};
const DEMO_CITIES = ["Bursa", "�stanbul", "�zmir", "Ankara", "Kocaeli"];
const DEMO_VENUES: DemoVenue[] = [
  { id: 1, city: "Bursa", name: "Nil�fer Spor Salonu" },
  { id: 2, city: "Bursa", name: "Tofa� Spor Salonu" },
  { id: 3, city: "Bursa", name: "Atat�rk Spor Salonu" },
  { id: 4, city: "�stanbul", name: "Sinan Erdem Yan Salon" },
  { id: 5, city: "�zmir", name: "Halkap�nar Spor Salonu" },
  { id: 6, city: "Ankara", name: "MEB Spor Salonu" },
  { id: 7, city: "Kocaeli", name: "�ehit Polis Recep Topalo�lu" },
];
const DEMO_TODAY_MATCHES: DemoMatch[] = [
  { id: 1, time: "10:00", city: "Bursa", venue: "Nil�fer Spor Salonu", home: "F�NAL SPOR U14", away: "TOFA� U14", homeTeamId: 1, awayTeamId: 2, category: "U14", competition: "Bursa U14 A Ligi", competitionType: "LEAGUE", countsForStandings: true, countsForSeasonStats: true },
  { id: 2, time: "12:00", city: "Bursa", venue: "Nil�fer Spor Salonu", home: "GEML�K U14", away: "BURSA BASKET U14", homeTeamId: 3, awayTeamId: 4, category: "U14", competition: "Bursa U14 A Ligi", competitionType: "LEAGUE", countsForStandings: true, countsForSeasonStats: true },
  { id: 3, time: "14:00", city: "Bursa", venue: "Tofa� Spor Salonu", home: "TOFA� U16", away: "F�NAL SPOR U16", homeTeamId: 5, awayTeamId: 6, category: "U16", competition: "Bursa U16 A Ligi", competitionType: "LEAGUE", countsForStandings: true, countsForSeasonStats: true },
  { id: 4, time: "11:00", city: "�stanbul", venue: "Sinan Erdem Yan Salon", home: "�STANBUL YILDIZLAR U14", away: "BASKET AKADEM� U14", homeTeamId: 7, awayTeamId: 8, category: "U14", competition: "�stanbul U14 A Ligi", competitionType: "LEAGUE", countsForStandings: true, countsForSeasonStats: true },
];
const HOME_PLAYERS = Array.from({ length: 26 }, (_, i) => {
  const jersey = i + 4;
  const names = ["Ahmet", "Mehmet", "Ali", "Burak", "Kerem", "Ege", "Okan", "Mert", "Can", "Tuna", "Emir", "Arda", "Kaan", "Deniz", "Efe", "Bora", "Yi�it", "Alp", "Umut", "Baran", "Doruk", "R�zgar", "Toprak", "Berk", "Eren", "Sarp"];
  return `#${jersey} ${names[i]}`;
});
const AWAY_PLAYERS = Array.from({ length: 30 }, (_, i) => {
  const jersey = i + 4;
  const names = ["Ali", "Efe", "Mert", "Can", "Deniz", "Kaan", "Aras", "Bora", "Eren", "Yi�it", "Alp", "Ozan", "Emirhan", "Taha", "Mira�", "Kutay", "Atlas", "Arda", "�a�an", "Koray", "R�za", "Salih", "Onur", "Talha", "Yaman", "Poyraz", "Mete", "Eymen", "Ak�n", "Bartu"];
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
  const [queueInfo, setQueueInfo] = useState("Demo ma� listesi a��k.");
  const cityOptions = adminCities.length ? adminCities : DEMO_CITIES;
  const allVenuesForSelect = adminVenues.length ? adminVenues : DEMO_VENUES;
  const cityVenues = allVenuesForSelect.filter((v) => v.city === selectedCity);
  const [specialHomeName, setSpecialHomeName] = useState("F�NAL SPOR U14");
  const [specialAwayName, setSpecialAwayName] = useState("KARMA TAKIM U16");
  const [specialMatchName, setSpecialMatchName] = useState("Haz�rl�k Ma��");
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
  const activeResumeMatches = sourceMatches.filter((m) => {
    const status = String(m.status || "").toUpperCase();
    return !m.locked && ["DEVAM_EDIYOR", "DEVAM", "LIVE", "CANLI"].includes(status);
  });
  const controlledTeamName = activeMatch ? (operatorSide === "HOME" ? activeMatch.home : activeMatch.away) : "TAKIM";
  const opponentTeamName = activeMatch ? (operatorSide === "HOME" ? activeMatch.away : activeMatch.home) : "D��ER TAKIM";
  const canStartClock = operatorSide === "HOME";
  const isSpecialOrFriendly = activeMatch?.competitionType === "SPECIAL_MATCH" || activeMatch?.competitionType === "FRIENDLY";
  const isTournamentMatch = activeMatch?.competitionType === "TOURNAMENT";
  const matchRosterLimit = isSpecialOrFriendly ? SPECIAL_MATCH_ROSTER_LIMIT : OFFICIAL_MATCH_ROSTER_LIMIT;

  const periodLabel =
    quarter <= 4 ? `${quarter}. �EYREK` : `UZATMA ${quarter - 4}`;

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
    log(`S�STEM: ${player} 5 faul yapt� ve oyun d��� kald�. De�i�iklik yap�lmadan oyun devam etmez.`);
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
        `S�STEM: ma� durumu kaydedilemedi ${String(err?.message || err).slice(0, 90)}`,
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


  function getOperatorDeviceId() {
    if (typeof window === "undefined") return "server";
    const key = "nonstop_operator_device_id";
    const existing = window.localStorage.getItem(key);
    if (existing) return existing;
    const next = `device_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem(key, next);
    return next;
  }

  async function postOperatorRejoin(action: "JOIN" | "HEARTBEAT" | "LEAVE" | "REJOIN") {
    if (!activeMatch?.id) return false;

    const body = {
      action,
      match_id: Number(activeMatch.id),
      team_id: Number(getControlledTeamId()),
      operator_side: operatorSide,
      device_id: getOperatorDeviceId(),
    };

    try {
      const res = await fetch("/api/operator-rejoin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || json?.ok === false) {
        if (action !== "HEARTBEAT") {
          log(`S�STEM: operat�r oturum hatas� ${action} ${String(json?.error || res.statusText).slice(0, 120)}`);
        }
        return false;
      }
      if (action !== "HEARTBEAT") {
        log(`S�STEM: operat�r oturumu ${json?.action || action} OK.`);
      }
      return true;
    } catch (err: any) {
      if (action !== "HEARTBEAT") {
        log(`S�STEM: operat�r oturum API hatas� ${String(err?.message || err).slice(0, 120)}`);
      }
      return false;
    }
  }

  function sendOperatorLeaveBeacon() {
    if (typeof window === "undefined" || !activeMatch?.id) return;
    const body = JSON.stringify({
      action: "LEAVE",
      match_id: Number(activeMatch.id),
      team_id: Number(getControlledTeamId()),
      operator_side: operatorSide,
      device_id: getOperatorDeviceId(),
    });

    try {
      if (navigator.sendBeacon) {
        const blob = new Blob([body], { type: "application/json" });
        navigator.sendBeacon("/api/operator-rejoin", blob);
      } else {
        fetch("/api/operator-rejoin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          keepalive: true,
        });
      }
    } catch {
      // Sayfa kapan�rken hata yazd�rmaya gerek yok.
    }
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
        log(`S�STEM: s�re kayd� hatas� ${action} ${String(json?.error || res.statusText).slice(0, 120)}`);
        return false;
      }
      return true;
    } catch (err: any) {
      log(`S�STEM: s�re API hatas� ${action} ${String(err?.message || err).slice(0, 120)}`);
      return false;
    }
  }

  async function openStarterMinuteSessions() {
    const ok = await postOperatorMinutes("OPEN_STARTERS", null, {
      quarter,
      clockSeconds: seconds,
      gameClock: fmt(seconds),
    });
    if (ok) log(`S�STEM: ${controlledTeamName} ilk 5 s�re kay�tlar� a��ld�.`);
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
    if (ok) log(`S�STEM: ${controlledTeamName} a��k s�re kay�tlar� kapat�ld�.`);
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
      log("S�STEM: s�reyi sadece ev sahibi operat�r� ba�latabilir.");
      return;
    }
    if (mustSubPlayer) {
      log(`S�STEM: ${mustSubPlayer} 5 faul nedeniyle oyundan ��kmal�. �nce de�i�iklik yap.`);
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
    if (!activeMatch?.id) return;
    if (!getControlledTeamId()) return;

    postOperatorRejoin("JOIN");

    const heartbeat = setInterval(() => {
      postOperatorRejoin("HEARTBEAT");
    }, 15000);

    const handleBeforeUnload = () => {
      sendOperatorLeaveBeacon();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearInterval(heartbeat);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      postOperatorRejoin("LEAVE");
    };
  }, [activeMatch?.id, operatorSide, activeMatch?.homeTeamId, activeMatch?.awayTeamId]);

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
        `S�STEM: ${quarter}. periyot bitti, ${nextQuarter}. periyot 10:00 haz�r. Ba�latmak i�in ? bas.`,
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
        `S�STEM: skor e�it, UZATMA ${nextQuarter - 4} 05:00 haz�r. Ba�latmak i�in ? bas.`,
      );
      persistMatchState("live", { quarter: nextQuarter, seconds: 300 });
      return;
    }

    closeOnCourtMinuteSessions(0);
    setMatchStatus("finished_pending");
    log("S�STEM: ma� bitti. 1 dakika d�zeltme s�resi ba�lad�.");
    persistMatchState("finished_pending", { seconds: 0 });

    const finishTimer = setTimeout(() => {
      setMatchStatus("finished");
      log("S�STEM: ma� kesin kaydedildi ve kilitlendi.");
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

    // V2.1.26H-4C: �lk 5 art�k otomatik se�ilmez.
    // Operat�r STARTERS ekran�nda tam 5 oyuncuyu manuel se�er.
    setRosterChecked(initialRoster);
    setStarterChecked([]);
    setSelectedPlayer(initialRoster[0] || "");
    setForfeitWarning(labels.length ? "" : "Bu tak�m i�in oyuncu bulunamad�. Mini Admin / Veri Y�netimi ekran�ndan oyuncu ekleyin.");
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
      log(`S�STEM: ${dbType} kaydedilemedi. �nce ge�erli oyuncu se�iniz.`);
      return false;
    }

    // Oyuncu do�rulamada as�l �art: ge�erli player_id bulunmas�d�r.
    // Not: onCourt listesi bazen oyuncu etiketiyle birebir e�le�medi�i i�in
    // se�ili oyuncu varken hatal� �oyuncu se�iniz� uyar�s� verebiliyordu.
    // Bu nedenle FOUL_DRAWN / FOUL / �ut / asist gibi kay�tlar i�in
    // oyuncu ID'si varsa kay�t yap�lmas�na izin veriyoruz. S�re ve sahada olma
    // hesab� ayr� olarak match_rosters + substitutions �zerinden yap�l�r.

    if (isFouledOut(player)) {
      log(`S�STEM: ${player} 5 faul nedeniyle istatistik alamaz.`);
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
        log(`S�STEM: kadro Supabase kay�t hatas� ${String(json?.error || res.statusText).slice(0, 120)}`);
        return;
      }
      log(`S�STEM: ${controlledTeamName} ma� kadrosu Supabase'e kaydedildi (${json?.count || rosterChecked.length} oyuncu).`);
    } catch (err: any) {
      log(`S�STEM: kadro kay�t API hatas� ${String(err?.message || err).slice(0, 120)}`);
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
        log(`S�STEM: de�i�iklik Supabase kay�t hatas� ${String(json?.error || res.statusText).slice(0, 120)}`);
        return;
      }
      log(`S�STEM: de�i�iklik Supabase'e kaydedildi. ${playerOut} OUT / ${playerIn} IN`);
    } catch (err: any) {
      log(`S�STEM: de�i�iklik API hatas� ${String(err?.message || err).slice(0, 120)}`);
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
          log(`S�STEM: ${player} faul say�s� ${nextCount}/5.`);
        }
        return next;
      });
    }

    if (shouldAutoStopClock(dbType)) {
      stopClock();
      log(`S�STEM: ${dbType} nedeniyle s�re otomatik durdu. Devam i�in ? bas.`);
      persistMatchState("live");
    }

    // Online modda olaylar� Supabase'e yazan Next.js API route'una g�nderir.
    // Demo sabitleri 003_demo_match_data.sql ile olu�turulan test ma��na ba�l�d�r.
    if (online) {
      const apiPayload = {
        client_event_id: event.event_id,
        event_type: dbType,
        // V2.1.18: her online olay zorunlu olarak API'ye gider.
        // API demo-no-db cevab� verirse art�k ba�ar� say�lmaz; ekranda g�r�n�r hata yazar.
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
              "NONSTOP Supabase kay�t hatas�:",
              rawText,
              apiPayload,
            );
            log(
              `S�STEM: Supabase kay�t hatas� (${dbType}) ${String(json?.error || rawText || res.statusText).slice(0, 140)}`,
            );
            return;
          }

          markSynced();
          const insertedId = json?.data?.id ? ` id:${json.data.id}` : "";
          log(`S�STEM: Supabase kay�t OK (${dbType})${insertedId}`);
        })
        .catch((err) => {
          console.error("NONSTOP API ba�lant� hatas�:", err, apiPayload);
          log(
            `S�STEM: API ba�lant� hatas� (${dbType}) ${String(err?.message || err).slice(0, 120)}`,
          );
        });
    }
  }

  async function syncNow() {
    markSynced();
    log("S�STEM: offline kuyruk senkronize edildi");
  }

  function toggleOnline() {
    const next = !online;
    setOnline(next);
    if (next) syncNow();
  }

  function eventOnly(type: string) {
    if (matchStatus === "finished") {
      log("S�STEM: ma� kilitli, yeni istatistik girilemez.");
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
      log("S�STEM: ma� kilitli, �ut girilemez.");
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
      log("S�STEM: serbest at�� / +1 i�in s�re durdu. �ut yerini sahadan i�aretle.");
      setPendingShot(ctx);
      return;
    }

    if (made) setShotModal(ctx);
    else setPendingShot(ctx);
  }

  function handleStatClick(points: 1 | 2 | 3) {
    // Tek t�k: 1 saniye bekler, ikinci t�k gelmezse isabetsiz at��.
    // Ayn� butona ikinci t�k 1 saniye i�inde gelirse say� olarak kaydeder.
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
        : "�SABETS�Z";

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
      log("S�STEM: 4. �eyrek son 2 dk say� oldu, s�re durdu. Devam i�in ? bas.");
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
    log("S�STEM: faul se�imi i�in s�re durdu. Devam i�in ? bas.");
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
          ? "FT?"
          : "FT�"
        : `${pendingShot.points}P${pendingShot.made ? "?" : "�"}`;
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
    log(`S�STEM: oyuncu de�i�ikli�i ba�lad�, s�re durdu. ${playerOut} i�in yedekten oyuncu se�. Devam i�in ? bas�lacak.`);
    persistMatchState("live");
  }

  async function saveSub(playerIn: string) {
    if (!subOut) return;

    const playerOut = subOut;
    if (playerIn === playerOut) return;
    if (isFouledOut(playerIn)) {
      log(`S�STEM: ${playerIn} 5 faul nedeniyle oyuna giremez.`);
      return;
    }

    // Oyuncu de�i�ikli�i sadece olay kayd� de�il, ekrandaki kadroyu da g�nceller.
    // ��kan oyuncu sahadan yedeklere, giren oyuncu yedekten sahaya ta��n�r.
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
    log("S�STEM: oyuncu de�i�ikli�i i�in s�re durdu. Devam i�in ? bas.");
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
    log(`${fmt(seconds)} DE����KL�K: ${playerOut} OUT / ${playerIn} IN`);
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
          competition: String(m.competition || "Resmi Ma�"),
          competitionType: (m.competitionType || "LEAGUE") as DemoMatch["competitionType"],
          countsForStandings: m.countsForStandings ?? true,
          countsForSeasonStats: m.countsForSeasonStats ?? true,
        })).filter((m: DemoMatch) => m.city && m.venue);
        setAdminCities(apiCities);
        setAdminVenues(apiVenues);
        setAdminMatches(apiMatches);
        setQueueInfo(apiMatches.length ? "Mini Admin ma�lar� y�klendi." : "Bug�n se�ili salonda Mini Admin ma�� yok. Demo liste a��k olabilir.");
      } catch (err: any) {
        setQueueInfo(`Mini Admin ma�lar� al�namad�: ${String(err?.message || err).slice(0, 80)}`);
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
          if (!cancelled) log(`S�STEM: oyuncular al�namad� ${String(json?.error || res.statusText).slice(0, 100)}`);
          return;
        }
        const nextHome = (json.homePlayers || []) as PlayerOption[];
        const nextAway = (json.awayPlayers || []) as PlayerOption[];
        setHomePlayers(nextHome);
        setAwayPlayers(nextAway);
      } catch (err: any) {
        if (!cancelled) log(`S�STEM: oyuncu API hatas� ${String(err?.message || err).slice(0, 100)}`);
      }
    }
    loadMatchPlayers();
    return () => { cancelled = true; };
  }, [activeMatch?.id, activeMatch?.homeTeamId, activeMatch?.awayTeamId]);

  useEffect(() => {
    if (!activeMatch) return;
    const labels = getSidePlayerLabels(operatorSide);
    if (!labels.length) return;

    // V2.1.26H-4C: Tak�m listesi/ma� kadrosu haz�r gelir,
    // fakat ilk 5 otomatik se�ilmez. �lk 5'i operat�r elle belirler.
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
        setForfeitWarning(`${isSpecialOrFriendly ? "�zel/haz�rl�k ma��nda" : "Resmi ma�ta"} ma� kadrosu en fazla ${matchRosterLimit} oyuncu olabilir.`);
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
    const home = specialHomeName.trim() || "EV SAH�B�";
    const away = specialAwayName.trim() || "M�SAF�R / KARMA";
    const specialMatch: DemoMatch = {
      id: 9000 + Date.now(),
      time: "�zel",
      city: selectedCity,
      venue: selectedVenue,
      home,
      away,
      homeTeamId: null,
      awayTeamId: null,
      category: "SERBEST",
      competition: specialMatchName.trim() || (operatorMatchType === "TOURNAMENT" ? "Turnuva Ma��" : "�zel / Haz�rl�k Ma��"),
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
      setForfeitWarning(`${controlledTeamName} i�in tam 5 oyuncu se�melisin. �lk 5 otomatik se�ilmez.`);
      return;
    }
    await saveRosterToDb(starterChecked.slice(0, 5));
    await closeTeamOpenMinuteSessions(seconds);
    await openStarterMinuteSessions();
    setOnCourt(starterChecked.slice(0, 5));
    setBench(rosterChecked.filter((p) => !starterChecked.includes(p)));
    setSelectedPlayer(starterChecked[0]);
    setFlowStep("GAME");
    log(`S�STEM: ${controlledTeamName} ilk 5 onayland�. ${operatorSide === "HOME" ? "S�re ba�latma yetkisi sende." : "S�reyi ev sahibi operat�r� ba�latacak."}`);
  }

  if (flowStep !== "GAME") {
    const sidePlayers = getSidePlayerLabels(operatorSide);
    return (
      <main className="nn-container" style={{ maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '2rem' }}>
        <div className="nn-header-area">
          <h1 className="nn-title" style={{ textAlign: 'center' }}>NONSTOP Operat�r Ak���</h1>
          <p className="nn-subtitle" style={{ textAlign: 'center' }}>�l se� � salon se� � bug�nk� ma� veya �zel ma� � g�rev taraf� � ma� kadrosu � ilk 5 � ma� ekran�</p>
        </div>

        <div className="nn-card">
          {flowStep === "CITY" && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h2 style={{ fontSize: '1.5rem', color: '#fff', borderBottom: '1px solid var(--nn-border)', paddingBottom: '0.5rem' }}>1. �l Se�</h2>
              <p style={{ color: 'var(--nn-text-muted)' }}>�nce il se�ilir. B�ylece y�zlerce salon i�inde kar���kl�k olmaz.</p>
              <div className="nn-form-group">
                <label className="nn-form-label">�ehir Se�imi</label>
                <select className="nn-select" value={selectedCity} onChange={(e) => {
                  const nextCity = e.target.value;
                  setSelectedCity(nextCity);
                  const firstVenue = allVenuesForSelect.find((v) => v.city === nextCity)?.name || "";
                  setSelectedVenue(firstVenue);
                }}>
                  {cityOptions.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <button className="nn-button nn-button-primary" style={{ alignSelf: 'flex-start', marginTop: '1rem' }} onClick={() => setFlowStep("VENUE")}>Salon Se�imine Ge� &rarr;</button>
            </div>
          )}

          {flowStep === "VENUE" && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h2 style={{ fontSize: '1.5rem', color: '#fff', borderBottom: '1px solid var(--nn-border)', paddingBottom: '0.5rem' }}>2. Salon Se�</h2>
              <p style={{ color: 'var(--nn-text-muted)' }}>Se�ili il: <b style={{ color: 'var(--nn-cyan)' }}>{selectedCity}</b></p>
              <div className="nn-form-group">
                <label className="nn-form-label">Salon Se�imi</label>
                <select className="nn-select" value={selectedVenue} onChange={(e) => setSelectedVenue(e.target.value)}>
                  {cityVenues.map((v) => <option key={v.id}>{v.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button className="nn-button nn-button-primary" onClick={() => setFlowStep("MATCH")}>Bug�nk� Ma�lar� Getir &rarr;</button>
                <button className="nn-button" style={{ background: 'transparent' }} onClick={() => setFlowStep("CITY")}>&larr; �l Se�imine D�n</button>
              </div>
            </div>
          )}

          {flowStep === "MATCH" && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h2 style={{ fontSize: '1.5rem', color: '#fff', borderBottom: '1px solid var(--nn-border)', paddingBottom: '0.5rem' }}>3. Bug�nk� Ma� S�ras�</h2>
              <p style={{ color: 'var(--nn-cyan)' }}>{queueInfo}</p>
              {activeResumeMatches.length > 0 ? (
                <div style={{ padding: '1rem', background: 'rgba(34,197,94,0.1)', border: '1px solid #22c55e', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <b style={{ color: '#fff' }}>Devam Eden Maca Geri Don</b>
                  <span style={{ color: 'var(--nn-text-muted)', fontSize: '0.9rem' }}>Acik kalan veya devam eden maclar burada gorunur. Mac listede cikmasa bile buradan geri donebilirsin.</span>
                  {activeResumeMatches.map((m) => (
                    <button
                      key={`resume-${m.id}`}
                      className="nn-button nn-button-success"
                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', height: 'auto', padding: '0.85rem' }}
                      onClick={() => {
                        setActiveMatch(m);
                        setRosterChecked([]);
                        setStarterChecked([]);
                        setSelectedPlayer("");
                        setFlowStep("ROSTER");
                      }}
                    >
                      <b>{m.home} - {m.away}</b>
                      <small>{m.venue} • {m.time} • {m.status || "DEVAM_EDIYOR"}</small>
                    </button>
                  ))}
                </div>
              ) : null}
              {todaysVenueMatches.length === 0 ? <div style={{ padding: '1rem', background: 'rgba(239,68,68,0.1)', color: '#fca5a5', border: '1px solid #ef4444', borderRadius: '8px' }}>Bu salon i�in bug�n ma� bulunamad�. Mini Admin�den ma� olu�turduktan sonra tekrar deneyin.</div> : null}
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginTop: '1rem' }}>
                {todaysVenueMatches.map((m, index) => (
                  <button key={m.id} className="nn-button" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '1rem', height: 'auto', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--nn-border)' }} onClick={() => { setActiveMatch(m); setRosterChecked([]); setStarterChecked([]); setSelectedPlayer(""); setFlowStep("ROSTER"); }}>
                    <b style={{ color: 'var(--nn-cyan)', marginBottom: '0.25rem' }}>{index + 1}. Ma� � {m.time}</b>
                    <span style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '0.25rem' }}>{m.home} - {m.away}</span>
                    <small style={{ color: 'var(--nn-text-muted)' }}>{m.competition}</small>
                  </button>
                ))}
              </div>

              <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--nn-border)' }}>
                <h3 style={{ fontSize: '1.25rem', color: 'var(--nn-orange)', marginBottom: '0.5rem' }}>Supervisor �zel / Haz�rl�k Ma��</h3>
                <p style={{ color: 'var(--nn-text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>U14 - U16, karma tak�m veya resmi fikst�re girmeyen ma�lar i�in. Bu ma� lig puan durumuna i�lemez; kendi i�inde istatistik ve �ut haritas� tutar.</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div className="nn-form-group">
                    <label className="nn-form-label">Ma� t�r�</label>
                    <select className="nn-select" value={operatorMatchType} onChange={(e) => setOperatorMatchType(e.target.value as any)}><option value="FRIENDLY">Haz�rl�k Ma��</option><option value="SPECIAL_MATCH">�zel Ma�</option><option value="TOURNAMENT">Turnuva Ma��</option></select>
                  </div>
                  <div className="nn-form-group">
                    <label className="nn-form-label">Ma� ad�</label>
                    <input className="nn-input" value={specialMatchName} onChange={(e) => setSpecialMatchName(e.target.value)} />
                  </div>
                  <div className="nn-form-group">
                    <label className="nn-form-label">1. Tak�m</label>
                    <input className="nn-input" value={specialHomeName} onChange={(e) => setSpecialHomeName(e.target.value)} />
                  </div>
                  <div className="nn-form-group">
                    <label className="nn-form-label">2. Tak�m / Karma</label>
                    <input className="nn-input" value={specialAwayName} onChange={(e) => setSpecialAwayName(e.target.value)} />
                  </div>
                </div>
                <button className="nn-button nn-button-success" onClick={createSpecialMatch}>Ma�� Operat�r Ak���na Al</button>
              </div>
              <button className="nn-button" style={{ background: 'transparent', alignSelf: 'flex-start', marginTop: '1rem' }} onClick={() => setFlowStep("VENUE")}>&larr; Salon Se�imine D�n</button>
            </div>
          )}

          {flowStep === "ROSTER" && activeMatch && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h2 style={{ fontSize: '1.5rem', color: '#fff', borderBottom: '1px solid var(--nn-border)', paddingBottom: '0.5rem' }}>4. Operat�r Taraf� ve Ma� Kadrosu</h2>
              {(activeMatch.competitionType === "SPECIAL_MATCH" || activeMatch.competitionType === "FRIENDLY" || activeMatch.competitionType === "TOURNAMENT") ? (
                <div style={{ padding: '1rem', background: 'rgba(0, 240, 255, 0.1)', color: 'var(--nn-cyan)', border: '1px solid var(--nn-cyan)', borderRadius: '8px' }}>
                  <b style={{ color: '#fff' }}>{activeMatch.competitionType === "TOURNAMENT" ? "Turnuva Ma��" : "�zel/Haz�rl�k Ma��"}</b><br />
                  <span style={{ fontSize: '0.9rem' }}>{activeMatch.competitionType === "TOURNAMENT" ? "Bu ma� oyuncu ve tak�m kart�nda Turnuvalar sekmesine ayr�l�r." : "Bu ma� puan durumuna i�lemez. �ut haritas�, faul haritas�, oyuncu ve tak�m ma� istatistikleri kendi i�inde tutulur."}</span>
                  <br /><span style={{ fontSize: '0.9rem' }}>{activeMatch.competitionType === "TOURNAMENT" ? "Turnuva kadro limiti resmi ma� gibi 12 oyuncudur." : "Bu ma� sezon istatisti�ine i�lemez. Oyuncu profilinde �zel/Haz�rl�k Ma�lar� b�l�m�nde ayr� g�r�n�r."}</span>
                </div>
              ) : null}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', margin: '1rem 0' }}>
                <button className="nn-button" style={{ display: 'flex', flexDirection: 'column', height: 'auto', padding: '1rem', border: operatorSide === "HOME" ? '2px solid var(--nn-cyan)' : '1px solid var(--nn-border)', background: operatorSide === "HOME" ? 'rgba(0,240,255,0.1)' : 'transparent' }} onClick={() => { setOperatorSide("HOME"); setTimeout(() => resetRosterForSide("HOME"), 0); }}><b style={{ color: operatorSide === "HOME" ? '#fff' : 'var(--nn-text-muted)', fontSize: '1.1rem' }}>Ev Sahibi Operat�r�</b><small style={{ color: 'var(--nn-text-muted)' }}>S�reyi ba�latabilir</small></button>
                <button className="nn-button" style={{ display: 'flex', flexDirection: 'column', height: 'auto', padding: '1rem', border: operatorSide === "AWAY" ? '2px solid var(--nn-cyan)' : '1px solid var(--nn-border)', background: operatorSide === "AWAY" ? 'rgba(0,240,255,0.1)' : 'transparent' }} onClick={() => { setOperatorSide("AWAY"); setTimeout(() => resetRosterForSide("AWAY"), 0); }}><b style={{ color: operatorSide === "AWAY" ? '#fff' : 'var(--nn-text-muted)', fontSize: '1.1rem' }}>Misafir Operat�r�</b><small style={{ color: 'var(--nn-text-muted)' }}>S�reyi ba�latamaz</small></button>
              </div>
              <h3 style={{ color: '#fff' }}>{controlledTeamName} tak�m listesinden ma� kadrosunu se�</h3>
              <p style={{ color: 'var(--nn-text-muted)', fontSize: '0.9rem' }}>Tak�m listesinde <b>{sidePlayers.length}</b> oyuncu olabilir. Ma� kadrosu ise <b>{rosterChecked.length}/{matchRosterLimit}</b>. Resmi ma�ta en fazla 12, �zel/haz�rl�k ma��nda en fazla 24 oyuncu se�ilebilir. En az 5 oyuncu zorunludur.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid var(--nn-border)' }}>
                {sidePlayers.map((p) => (
                  <label key={p} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: rosterChecked.includes(p) ? '#fff' : 'var(--nn-text-muted)', background: rosterChecked.includes(p) ? 'rgba(0,240,255,0.1)' : 'transparent', padding: '0.5rem', borderRadius: '4px' }}>
                    <input type="checkbox" checked={rosterChecked.includes(p)} onChange={() => toggleRosterPlayer(p)} style={{ accentColor: 'var(--nn-cyan)' }} /> {p}
                  </label>
                ))}
              </div>
              <button className="nn-button nn-button-primary" style={{ alignSelf: 'flex-start', marginTop: '1rem' }} onClick={() => {
                if (rosterChecked.length < 5) { setForfeitWarning(`${controlledTeamName} 5 oyuncu bildirmedi. H�kmen yenilgi riski var.`); return; }
                if (rosterChecked.length > matchRosterLimit) { setForfeitWarning(`Ma� kadrosu en fazla ${matchRosterLimit} oyuncu olabilir.`); return; }
                setForfeitWarning(""); setFlowStep("STARTERS");
              }}>Kadro Tamam &rarr;</button>
              {forfeitWarning && <div style={{ color: '#ef4444', marginTop: '1rem' }}>{forfeitWarning}</div>}
            </div>
          )}

          {flowStep === "STARTERS" && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h2 style={{ fontSize: '1.5rem', color: '#fff', borderBottom: '1px solid var(--nn-border)', paddingBottom: '0.5rem' }}>5. �lk 5 Belirle</h2>
              <p style={{ color: 'var(--nn-text-muted)' }}>Se�ilen ma� kadrosundan sahaya ��kacak tam 5 oyuncu se�ilmeli. �u an: <b style={{ color: starterChecked.length === 5 ? '#22c55e' : 'var(--nn-orange)' }}>{starterChecked.length}/5</b></p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.5rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid var(--nn-border)' }}>
                {rosterChecked.map((p) => (
                  <label key={p} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: starterChecked.includes(p) ? '#fff' : 'var(--nn-text-muted)', background: starterChecked.includes(p) ? 'rgba(255,87,34,0.1)' : 'transparent', padding: '0.5rem', borderRadius: '4px' }}>
                    <input type="checkbox" checked={starterChecked.includes(p)} onChange={() => toggleStarter(p)} style={{ accentColor: 'var(--nn-orange)' }} /> {p}
                  </label>
                ))}
              </div>
              <button className="nn-button nn-button-success" style={{ alignSelf: 'flex-start', marginTop: '1rem' }} onClick={confirmStarters}>Ma� Ekran�na Ge� &rarr;</button>
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
            <span>EV SAH�B�</span>
            <h1>{activeMatch?.home || "EV SAH�B�"}</h1>
            <div className="team-fouls" title="Tak�m faulleri">
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
            <button onClick={startClock}>? DEVAM ET</button>
            <button
              onClick={() => {
                stopClock();
                persistMatchState("live");
              }}
            >
              ? DURDUR
            </button>
          </div>
          <small>
            Durum:{" "}
            {matchStatus === "live"
              ? "CANLI"
              : matchStatus === "finished_pending"
                ? "1 DK D�ZELTME"
                : "K�L�TL�"}
          </small>
          <small>
            {online ? "ONLINE" : "OFFLINE"} / Queue:{" "}
            {typeof window !== "undefined"
              ? getQueue().filter((e) => e.status !== "synced").length
              : 0}
          </small>
          {activeMatch?.competitionType === "SPECIAL_MATCH" || activeMatch?.competitionType === "FRIENDLY" ? (
            <small>�ZEL/HAZIRLIK � Puan/sezon tablosuna i�lemez</small>
          ) : activeMatch?.competitionType === "TOURNAMENT" ? (
            <small>TURNUVA � Kariyerde ayr� sekmede</small>
          ) : null}
          <button onClick={toggleOnline}>
            {online ? "Offline Yap" : "Online Yap"}
          </button>
        </div>
        <div className="team-score away">
          <div>
            <span>M�SAF�R</span>
            <h1>{activeMatch?.away || "M�SAF�R"}</h1>
            <div className="team-fouls" title="Tak�m faulleri">
              <small>FAUL</small>
              <div className="foul-dots">{foulDots(awayTeamFouls)}</div>
            </div>
          </div>
          <b>{awayScore}</b>
        </div>
      </header>

      <section className="stat-footer">
        <div className="stat-context">
          <span>�statistik Giri�i</span>
          <b>{selectedPlayer}</b>
          <small>
            Tek t�k: 1 sn bekler, isabetsiz at�� � �ift t�k: say� � +1: faul
            �izgisi
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
          <button onClick={() => eventOnly("STL")}>Top �alma</button>
          <button onClick={() => eventOnly("TOV")}>Top Kayb�</button>
          <button onClick={() => startFoulPick("FOUL")}>Faul</button>
          <button onClick={() => startFoulPick("FOUL_DRAWN")}>Faul Ald�</button>
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
                �utlar
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
              Saha Y�n�n� �evir ??
            </button>
          </div>

          {(pendingShot || pendingFoul) && (
            <div className="shot-pick-banner">
              {pendingShot ? (
                <>
                  <b>{pendingShot.player}</b>{" "}
                  {pendingShot.made ? "say�" : "isabetsiz at��"} i�in sahada
                  yeri t�kla.
                </>
              ) : (
                <>
                  <b>{selectedPlayer}</b> {pendingFoul} i�in faul yerini t�kla.
                </>
              )}
              <button
                onClick={() => {
                  setPendingShot(null);
                  setPendingFoul(null);
                }}
              >
                Vazge�
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
              <span>{operatorSide === "HOME" ? "Ev sahibi operat�r�" : "Misafir operat�r�"} / sadece kendi tak�m�n</span>
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
                    log(`S�STEM: ${p} 5 faul nedeniyle se�ilemez.`);
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
                    F: {playerFouls[p] || 0}/5 {isFouledOut(p) && "DI�I"}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    beginSubstitution(p);
                  }}
                >
                  De�i�
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
                      log(`S�STEM: ${p} 5 faul nedeniyle se�ilemez.`);
                      return;
                    }
                    setSelectedPlayer(p);
                  }}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <span>{p} {isFouledOut(p) ? "??" : ""}</span>
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
            <span>Se�ili Oyuncu</span>
            <strong>{selectedPlayer}</strong>
            <small>PF: {playerFouls[selectedPlayer] || 0}/5 {isFouledOut(selectedPlayer) ? "� OYUN DI�I" : ""}</small>
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
              {shotModal.player} {shotModal.points} Say�
            </h2>
            <p>
              �ift t�k say� olarak kaydedildi. Asist / faul se�, sonra �ut
              yerini sahadan i�aretle.
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
                �ut Yerini Se�
              </button>
              <button onClick={saveShotWithoutLocation}>Konumsuz Kaydet</button>
              <button onClick={() => setShotModal(null)}>�ptal</button>
            </div>
          </div>
        </div>
      )}

      {subOut && (
        <div className="modal-backdrop">
          <div className="modal small">
            <h2>Oyuncu De�i�ikli�i</h2>
            <p>
              ��kan oyuncu: <b>{subOut}</b>
              {mustSubPlayer === subOut ? <><br /><b style={{ color: "#facc15" }}>5 faul nedeniyle zorunlu de�i�iklik</b></> : null}
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
                  � {p} {isFouledOut(p) ? "Giremez" : "Oyuna Gir"}
                </button>
              ))}
            </div>
            <br />
            <button onClick={() => setSubOut(null)}>�ptal</button>
          </div>
        </div>
      )}
    </div>
  );
}