"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type QueueMatch = {
  id: number;
  time?: string;
  city?: string;
  venue?: string;
  home?: string;
  away?: string;
  homeTeamId?: number | null;
  awayTeamId?: number | null;
  status?: string;
  locked?: boolean;
  competition?: string;
  category?: string;
};

type LiveScore = {
  ok: boolean;
  match_id: number;
  home_team_id: number;
  away_team_id: number;
  home_score: number;
  away_score: number;
  current_quarter: number;
  clock_seconds: number;
  status: string;
  updated_at?: string | null;
  source?: string;
  error?: string;
};

function fmtClock(seconds: number) {
  const safe = Math.max(0, Number(seconds || 0));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function periodLabel(q: number) {
  const quarter = Number(q || 1);
  if (quarter <= 4) return `${quarter}. PERİYOT`;
  return `UZATMA ${quarter - 4}`;
}

function isLiveStatus(status?: string) {
  return String(status || "").toUpperCase() === "DEVAM_EDIYOR";
}

export default function LiveScoreboardCenter() {
  const [selectedMatchId, setSelectedMatchId] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setSelectedMatchId(Number(params.get("match_id") || 0));
  }, []);

  const [matches, setMatches] = useState<QueueMatch[]>([]);
  const [score, setScore] = useState<LiveScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const selectedMatch = useMemo(
    () => matches.find((m) => Number(m.id) === selectedMatchId) || null,
    [matches, selectedMatchId],
  );

  async function loadMatches() {
    try {
      const res = await fetch("/api/operator-queue", { cache: "no-store" });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || res.statusText || "Canlı maç listesi alınamadı.");
      }
      const list = (json.matches || json.adminMatches || []) as QueueMatch[];
      setMatches(list.filter((m) => isLiveStatus(m.status) && !m.locked));
      setLastRefresh(new Date());
    } catch (err: any) {
      setError(String(err?.message || err).slice(0, 180));
    }
  }

  async function loadScore(matchId: number) {
    if (!matchId) return;
    try {
      const res = await fetch(`/api/live-score?match_id=${matchId}`, { cache: "no-store" });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || res.statusText || "Canlı skor alınamadı.");
      }
      setScore(json as LiveScore);
      setLastRefresh(new Date());
      setError("");
    } catch (err: any) {
      setError(String(err?.message || err).slice(0, 180));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setLoading(true);
    loadMatches().finally(() => setLoading(false));
    const t = setInterval(loadMatches, 5000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!selectedMatchId) {
      setScore(null);
      return;
    }
    loadScore(selectedMatchId);
    const t = setInterval(() => loadScore(selectedMatchId), 2000);
    return () => clearInterval(t);
  }, [selectedMatchId]);

  return (
    <main className="dashboard" style={{ minHeight: "100vh", padding: 24 }}>
      <div className="topbar" style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <b>NONSTOP Canlı Skor Merkezi</b>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/operator">Operatör</Link>
          <Link href="/live">Canlı Maçlar</Link>
        </div>
      </div>

      {error ? (
        <section className="card" style={{ marginTop: 16, border: "1px solid #ef4444", color: "#fecaca" }}>
          <b>Uyarı</b>
          <p>{error}</p>
        </section>
      ) : null}

      {!selectedMatchId ? (
        <section className="card" style={{ marginTop: 18 }}>
          <h1>Canlı Maçlar</h1>
          <p style={{ marginTop: 8, color: "var(--muted, #94a3b8)" }}>
            DEVAM_EDIYOR durumundaki kilitsiz maçlar burada listelenir. Maça tıklayınca yayın skorboardu açılır.
          </p>

          {loading ? <p style={{ marginTop: 16 }}>Canlı maçlar yükleniyor...</p> : null}

          {!loading && matches.length === 0 ? (
            <div style={{ marginTop: 16, padding: 16, border: "1px solid #334155", borderRadius: 12 }}>
              Şu anda devam eden maç bulunmuyor.
            </div>
          ) : null}

          <div style={{ display: "grid", gap: 12, marginTop: 18 }}>
            {matches.map((m) => (
              <Link
                key={m.id}
                href={`/live?match_id=${m.id}`}
                className="card"
                style={{
                  display: "grid",
                  gap: 6,
                  textDecoration: "none",
                  border: "1px solid #22c55e",
                  borderRadius: 14,
                  padding: 16,
                }}
              >
                <b style={{ fontSize: 20 }}>{m.home || "Ev Sahibi"} - {m.away || "Misafir"}</b>
                <span>{m.venue || "Salon"} • {m.time || "Saat"}</span>
                <small>{m.competition || "Maç"} • Match ID: {m.id}</small>
                <strong style={{ color: "#22c55e" }}>Skorboardu Aç →</strong>
              </Link>
            ))}
          </div>
        </section>
      ) : (
        <section style={{ marginTop: 18 }}>
          <Link href="/live" style={{ display: "inline-block", marginBottom: 14 }}>← Canlı maçlara dön</Link>

          <div className="card" style={{ textAlign: "center", padding: 24 }}>
            <div style={{ color: "var(--muted, #94a3b8)", marginBottom: 10 }}>
              Match ID: {selectedMatchId} {selectedMatch?.venue ? `• ${selectedMatch.venue}` : ""}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 18, alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 18, color: "var(--muted, #94a3b8)" }}>EV SAHİBİ</div>
                <h1 style={{ fontSize: 32, margin: "8px 0" }}>{selectedMatch?.home || "Ev Sahibi"}</h1>
                <div style={{ fontSize: 76, fontWeight: 900 }}>{score?.home_score ?? 0}</div>
              </div>

              <div style={{ minWidth: 160 }}>
                <div style={{ fontSize: 22, fontWeight: 800 }}>{periodLabel(score?.current_quarter || 1)}</div>
                <div style={{ fontSize: 48, fontWeight: 900, margin: "12px 0" }}>{fmtClock(score?.clock_seconds ?? 600)}</div>
                <div style={{ color: "#22c55e", fontWeight: 800 }}>{score?.status || "DEVAM_EDIYOR"}</div>
              </div>

              <div>
                <div style={{ fontSize: 18, color: "var(--muted, #94a3b8)" }}>MİSAFİR</div>
                <h1 style={{ fontSize: 32, margin: "8px 0" }}>{selectedMatch?.away || "Misafir"}</h1>
                <div style={{ fontSize: 76, fontWeight: 900 }}>{score?.away_score ?? 0}</div>
              </div>
            </div>

            <div style={{ marginTop: 20, color: "var(--muted, #94a3b8)" }}>
              Son güncelleme: {lastRefresh ? lastRefresh.toLocaleTimeString("tr-TR") : "-"}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
