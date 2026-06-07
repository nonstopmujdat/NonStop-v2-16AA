import Link from 'next/link';
import { getSupabaseAdmin, hasSupabaseAdminConfig } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

type Team = { id: number; name: string };
type MatchRow = {
  id: number;
  home_team_id: number | null;
  away_team_id: number | null;
  current_quarter: number | null;
  clock_seconds: number | null;
  home_score: number | null;
  away_score: number | null;
};
type EventRow = { event_type: string; team_id: number | null };
type Player = { id: number; jersey_no: number | null; first_name: string; last_name: string };
type PlayerStat = {
  id: number;
  match_id: number;
  player_id: number;
  team_id: number | null;
  points: number | null;
  rebounds: number | null;
  assists: number | null;
  steals: number | null;
  blocks: number | null;
  turnovers: number | null;
  fouls: number | null;
};
type TeamPeriodStat = {
  id: number;
  match_id: number;
  quarter: number;
  team_id: number;
  points: number | null;
  fouls: number | null;
  rebounds: number | null;
  assists: number | null;
  steals: number | null;
  turnovers: number | null;
  blocks: number | null;
};

function pointsForEvent(type: string) {
  switch (String(type || '').toUpperCase()) {
    case '2PA_MADE':
    case '2PM':
      return 2;
    case '3PA_MADE':
    case '3PM':
      return 3;
    case 'FTA_MADE':
    case 'FTM':
      return 1;
    default:
      return 0;
  }
}

function fmtClock(seconds: number | null | undefined) {
  const s = Number(seconds ?? 0);
  const safe = Number.isFinite(s) ? Math.max(0, s) : 0;
  return `${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`;
}

export default async function LivePage() {
  if (!hasSupabaseAdminConfig()) {
    return (
      <main className="dashboard">
        <div className="topbar"><b>NONSTOP Canlı Skor</b><Link href="/operator">Operatör</Link></div>
        <div className="card">Supabase ortam değişkenleri eksik. Render Environment içinde NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY olmalı.</div>
      </main>
    );
  }

  const supabase = getSupabaseAdmin();
  const matchId = 1;

  const { data: match } = await supabase
    .from('matches')
    .select('id,home_team_id,away_team_id,current_quarter,clock_seconds,home_score,away_score')
    .eq('id', matchId)
    .maybeSingle<MatchRow>();

  const { data: teams = [] } = await supabase
    .from('teams')
    .select('id,name')
    .in('id', [match?.home_team_id || 1, match?.away_team_id || 2]);

  const teamMap = new Map<number, Team>((teams as Team[]).map(t => [t.id, t]));
  const homeTeamId = Number(match?.home_team_id || 1);
  const awayTeamId = Number(match?.away_team_id || 2);
  const homeTeam = teamMap.get(homeTeamId)?.name || 'FİNAL SPOR U14';
  const awayTeam = teamMap.get(awayTeamId)?.name || 'TOFAŞ U14';

  const { data: events = [] } = await supabase
    .from('match_events')
    .select('event_type,team_id')
    .eq('match_id', matchId);

  const score = (events as EventRow[]).reduce((acc, e) => {
    const pts = pointsForEvent(e.event_type);
    if (Number(e.team_id) === homeTeamId) acc.home += pts;
    if (Number(e.team_id) === awayTeamId) acc.away += pts;
    return acc;
  }, { home: 0, away: 0 });

  const { data: stats = [] } = await supabase
    .from('player_game_stats')
    .select('id,match_id,player_id,team_id,points,rebounds,assists,steals,blocks,turnovers,fouls')
    .eq('match_id', matchId)
    .order('points', { ascending: false });

  const playerIds = Array.from(new Set((stats as PlayerStat[]).map(s => s.player_id).filter(Boolean)));
  const { data: players = [] } = playerIds.length
    ? await supabase.from('players').select('id,jersey_no,first_name,last_name').in('id', playerIds)
    : { data: [] as Player[] };
  const playerMap = new Map<number, Player>((players as Player[]).map(p => [p.id, p]));

  const { data: periodStats = [] } = await supabase
    .from('team_period_stats')
    .select('id,match_id,quarter,team_id,points,fouls,rebounds,assists,steals,turnovers,blocks')
    .eq('match_id', matchId)
    .order('quarter', { ascending: true });

  const periodMap = new Map<string, TeamPeriodStat>();
  (periodStats as TeamPeriodStat[]).forEach(row => periodMap.set(`${row.quarter}-${row.team_id}`, row));
  const maxQuarter = Math.max(4, ...(periodStats as TeamPeriodStat[]).map(row => Number(row.quarter || 1)));
  const quarterNumbers = Array.from({ length: maxQuarter }, (_, i) => i + 1);

  return (
    <main className="dashboard live-dashboard">
      <div className="topbar">
        <b>NONSTOP Canlı Skor ve Oyuncu İstatistikleri</b>
        <div style={{ display: 'flex', gap: 12 }}><Link href="/operator">Operatör</Link><Link href="/dashboard">Dashboard</Link></div>
      </div>

      <section className="live-score-card">
        <div className="live-team"><span>EV SAHİBİ</span><h1>{homeTeam}</h1><b>{score.home}</b></div>
        <div className="live-clock"><span>{Number(match?.current_quarter || 1)}. ÇEYREK</span><strong>{fmtClock(match?.clock_seconds ?? 600)}</strong><small>match_id: {matchId}</small></div>
        <div className="live-team away"><span>MİSAFİR</span><h1>{awayTeam}</h1><b>{score.away}</b></div>
      </section>


      <section className="card">
        <h2>Periyot Skoru</h2>
        <div className="stats-table-wrap">
          <table className="stats-table period-table">
            <thead>
              <tr>
                <th>Takım</th>
                {quarterNumbers.map(q => <th key={q}>{q <= 4 ? `${q}P` : `OT${q - 4}`}</th>)}
                <th>Toplam</th>
              </tr>
            </thead>
            <tbody>
              {[{ id: homeTeamId, name: homeTeam }, { id: awayTeamId, name: awayTeam }].map(team => {
                const total = quarterNumbers.reduce((sum, q) => sum + Number(periodMap.get(`${q}-${team.id}`)?.points || 0), 0);
                return (
                  <tr key={team.id}>
                    <td>{team.name}</td>
                    {quarterNumbers.map(q => <td key={q}>{periodMap.get(`${q}-${team.id}`)?.points ?? 0}</td>)}
                    <td><b style={{ fontSize: 18 }}>{total}</b></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h2>Oyuncu İstatistik Paneli</h2>
        <div className="stats-table-wrap">
          <table className="stats-table">
            <thead>
              <tr><th>Oyuncu</th><th>Team ID</th><th>PTS</th><th>REB</th><th>AST</th><th>STL</th><th>BLK</th><th>TOV</th><th>PF</th></tr>
            </thead>
            <tbody>
              {(stats as PlayerStat[]).map(row => {
                const p = playerMap.get(row.player_id);
                const name = p ? `#${p.jersey_no ?? '-'} ${p.first_name} ${p.last_name}` : `Player ${row.player_id}`;
                return (
                  <tr key={row.id}>
                    <td>{name}</td><td>{row.team_id ?? '-'}</td><td>{row.points ?? 0}</td><td>{row.rebounds ?? 0}</td><td>{row.assists ?? 0}</td><td>{row.steals ?? 0}</td><td>{row.blocks ?? 0}</td><td>{row.turnovers ?? 0}</td><td>{row.fouls ?? 0}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
