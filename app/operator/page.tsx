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

export default function OperatorPage() {
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
  const [selectedPlayer, setSelectedPlayer] = useState("#7 Burak");
  const [playerFouls, setPlayerFouls] = useState<Record<string, number>>({});
  const [fouledOutPlayers, setFouledOutPlayers] = useState<string[]>([]);
  const [mustSubPlayer, setMustSubPlayer] = useState<string | null>(null);
  const [feed, setFeed] = useState<string[]>([]);
  const [shotModal, setShotModal] = useState<ShotContext | null>(null);
  const [pendingShot, setPendingShot] = useState<ShotContext | null>(null);
  const [pendingFoul, setPendingFoul] = useState<string | null>(null);
  const [subOut, setSubOut] = useState<string | null>(null);
  const [online, setOnline] = useState(true);
  const [onCourt, setOnCourt] = useState([
    "#7 Burak",
    "#4 Ahmet",
    "#5 Mehmet",
    "#6 Ali",
    "#8 Kerem",
  ]);
  const [bench, setBench] = useState([
    "#9 Ege",
    "#10 Okan",
    "#11 Mert",
    "#12 Can",
    "#13 Tuna",
    "#14 Emir",
    "#15 Arda",
  ]);
  const [courtTab, setCourtTab] = useState<CourtTab>("court");
  const clickTimer = useRef<any>(null);
  const clickPoints = useRef<1 | 2 | 3 | null>(null);
  const [markers, setMarkers] = useState<CourtMarker[]>([]);

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
          match_id: 1,
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

  function startClock() {
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
      setQuarter(nextQuarter);
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
      setQuarter(nextQuarter);
      setSeconds(300);
      resetPeriodTeamFouls();
      log(
        `SİSTEM: skor eşit, UZATMA ${nextQuarter - 4} 05:00 hazır. Başlatmak için ▶ bas.`,
      );
      persistMatchState("live", { quarter: nextQuarter, seconds: 300 });
      return;
    }

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

  function getDemoPlayerId(player: string) {
    const match = player.match(/#(\d+)/);
    if (!match) return null;
    const jersey = Number(match[1]);
    const map: Record<number, number> = {
      7: 1,
      4: 2,
      5: 3,
      6: 4,
      8: 5,
      9: 6,
      10: 7,
      11: 8,
      12: 9,
      13: 10,
      14: 11,
      15: 12,
    };
    return map[jersey] || null;
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
    const playerId = payload.player_id ?? getDemoPlayerId(player);

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
        match_id: Number(payload.match_id ?? 1),
        team_id: Number(payload.team_id ?? 1),
        player_id: playerId ?? null,
        related_player_id:
          payload.related_player_id ??
          (payload.related_player
            ? getDemoPlayerId(payload.related_player)
            : null),
        quarter: Number(payload.quarter ?? quarter ?? 1),
        game_clock: payload.game_clock || fmt(seconds) || "10:00",
        operator_side: "HOME_OPERATOR",
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
    if (isFouledOut(selectedPlayer)) {
      log(`SİSTEM: ${selectedPlayer} 5 faul nedeniyle tekrar istatistik alamaz.`);
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
    if (isFouledOut(selectedPlayer)) {
      log(`SİSTEM: ${selectedPlayer} 5 faul nedeniyle oyuna dönemez / istatistik alamaz.`);
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
      log("SİSTEM: serbest atış / +1 için süre durdu. Devam için ▶ bas.");
      saveShot(ctx, { x: 15, y: 50 });
      setMarkers((prev) => [
        {
          id: createEventId(),
          x: 15,
          y: 50,
          label: made ? "FT✓" : "FT×",
          made,
          kind: "shot",
        },
        ...prev,
      ]);
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

    if (
      context.made &&
      context.assist &&
      context.assist !== "YOK" &&
      context.assist !== "PENDING"
    ) {
      addQueue("AST", context.assist, {
        linked_basket_id: context.linked_basket_id,
        assist: context.assist,
        related_player_id: getDemoPlayerId(context.player),
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
      });
      addQueue("FOUL", context.foul, {
        linked_basket_id: context.linked_basket_id,
        committed_by: context.foul,
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
    stopClock();
    log("SİSTEM: faul seçimi için süre durdu. Devam için ▶ bas.");
    setPendingShot(null);
    setPendingFoul(type);
    setCourtTab("fouls");
  }

  function handleCourtClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

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

  function saveSub(playerIn: string) {
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
      player_out: playerOut,
      player_in: playerIn,
      related_player_id: getDemoPlayerId(playerIn),
    });
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

  return (
    <div className="operator-page">
      <header className="score-header">
        <div className="team-score">
          <div>
            <span>EV SAHİBİ</span>
            <h1>FİNAL SPOR U14</h1>
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
          <button onClick={toggleOnline}>
            {online ? "Offline Yap" : "Online Yap"}
          </button>
        </div>
        <div className="team-score away">
          <div>
            <span>MİSAFİR</span>
            <h1>TOFAŞ U14</h1>
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
          <div className="court-toolbar">
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
            className={`court ${pendingShot || pendingFoul ? "picking-shot" : ""} ${courtTab === "heat" ? "heat-mode" : ""}`}
            onClick={handleCourtClick}
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
                style={{ left: `${m.x}%`, top: `${m.y}%` }}
              >
                {courtTab === "heat" ? "" : m.label}
              </div>
            ))}
          </div>
        </section>

        <aside className="roster-panel">
          <div className="panel-title">
            <div>
              <h2>FİNAL SPOR U14</h2>
              <span>Sadece kontrol edilen takım</span>
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
                <div>
                  <b>{p}</b>
                  <small>{isFouledOut(p) ? "5 Faul - Oyun Dışı" : `Oyunda / PF ${playerFouls[p] || 0}`}</small>
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
                >
                  {p} {isFouledOut(p) ? "🚫" : ""}
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
                <button onClick={() => setFoul("#12 Rakip")}>
                  #12 Rakip PF
                </button>
                <button onClick={() => setFoul("#15 Rakip")}>
                  #15 Rakip PF
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
