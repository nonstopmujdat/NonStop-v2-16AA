import Link from 'next/link';
import { getSupabaseAdmin, hasSupabaseAdminConfig } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

type TeamDashboardRow = {
  team_id: number;
  team_name: string | null;
  games: number;
  points: number;
  rebounds: number;
  assists: number;
  turnovers: number;
  steals: number;
  blocks: number;
  fouls: number;
  offensive_rebounds: number;
  defensive_rebounds: number;
  fgm: number;
  fga: number;
  tpm: number;
  tpa: number;
  ftm: number;
  fta: number;
  fg_pct: number | null;
  tp_pct: number | null;
  ft_pct: number | null;
  ts_pct: number | null;
  efg_pct: number | null;
};

type MvpLeaderRow = {
  match_id: number;
  team_id: number;
  team_name: string | null;
  player_id: number;
  player_name: string | null;
  player_group: 'STARTER' | 'BENCH' | string;
  pts: number;
  reb: number;
  ast: number;
  vp_score: number;
  perf40: number;
  mvp_score: number;
  plus_minus: number;
};

type StarterBenchRow = {
  match_id: number;
  team_id: number;
  team_name: string | null;
  group_type: 'STARTER' | 'BENCH' | string;
  player_count: number;
  minutes: number;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fouls: number;
  vp_score: number;
  avg_mvp_score: number;
  plus_minus: number;
};

function cell(value: any, suffix = '') {
  if (value === null || value === undefined || value === '') return '-';
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  return `${n}${suffix}`;
}

function leaderCard(title: string, rows: MvpLeaderRow[]) {
  return (
    <section className="card" style={{ marginTop: 18 }}>
      <h2>{title}</h2>
      {rows.length ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          {rows.slice(0, 5).map((r, index) => (
            <div key={`${title}-${r.player_id}-${index}`} className="stat-card">
              <b>
                {index === 0 ? '🥇 ' : index === 1 ? '🥈 ' : index === 2 ? '🥉 ' : ''}
                {r.player_name || r.player_id}
              </b>
              <span>MVP: {cell(r.mvp_score)}</span>
              <small>VP: {cell(r.vp_score)} · PTS: {cell(r.pts)} · +/- {cell(r.plus_minus)}</small>
            </div>
          ))}
        </div>
      ) : (
        <p>Veri bulunamadı.</p>
      )}
    </section>
  );
}

export default async function MiniAdminTeamDashboardPage() {
  let rows: TeamDashboardRow[] = [];
  let leaders: MvpLeaderRow[] = [];
  let starterBench: StarterBenchRow[] = [];
  let errorMessage = '';

  if (hasSupabaseAdminConfig()) {
    const supabase = getSupabaseAdmin();

    const [dashboardRes, leadersRes, starterBenchRes] = await Promise.all([
      supabase.from('live_team_dashboard').select('*').order('points', { ascending: false }),
      supabase.from('live_team_mvp_leaders').select('*').order('mvp_score', { ascending: false }),
      supabase.from('live_team_starter_bench_dashboard').select('*').order('team_id').order('group_type'),
    ]);

    rows = (dashboardRes.data || []) as TeamDashboardRow[];
    leaders = (leadersRes.data || []) as MvpLeaderRow[];
    starterBench = (starterBenchRes.data || []) as StarterBenchRow[];

    errorMessage =
      dashboardRes.error?.message ||
      leadersRes.error?.message ||
      starterBenchRes.error?.message ||
      '';
  }

  const topTeam = rows[0];
  const starterLeaders = leaders.filter((r) => r.player_group === 'STARTER');
  const benchLeaders = leaders.filter((r) => r.player_group === 'BENCH');

  return (
    <main className="dashboard">
      <div className="topbar">
        <b>📊 Takım Analizi</b>
        <div>
          <Link href="/mini-admin">Mini Admin</Link>
          <Link href="/mini-admin/reports">Raporlar</Link>
        </div>
      </div>

      <section className="card">
        <h1>NONSTOP Takım Dashboard</h1>
        <p>
          Takım özeti, şut verimliliği, ilk 5 / bench katkısı ve MVP liderleri bu ekranda gösterilir.
        </p>
        {errorMessage ? (
          <p><b>Supabase hata:</b> {errorMessage}</p>
        ) : null}
      </section>

      {topTeam ? (
        <>
          <section className="card" style={{ marginTop: 18 }}>
            <h2>🏀 Takım Özeti: {topTeam.team_name || topTeam.team_id}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
              <div className="stat-card"><b>Maç</b><span>{cell(topTeam.games)}</span></div>
              <div className="stat-card"><b>Sayı</b><span>{cell(topTeam.points)}</span></div>
              <div className="stat-card"><b>Ribaund</b><span>{cell(topTeam.rebounds)}</span></div>
              <div className="stat-card"><b>Asist</b><span>{cell(topTeam.assists)}</span></div>
              <div className="stat-card"><b>Top Kaybı</b><span>{cell(topTeam.turnovers)}</span></div>
              <div className="stat-card"><b>Top Çalma</b><span>{cell(topTeam.steals)}</span></div>
              <div className="stat-card"><b>Blok</b><span>{cell(topTeam.blocks)}</span></div>
              <div className="stat-card"><b>Faul</b><span>{cell(topTeam.fouls)}</span></div>
            </div>
          </section>

          <section className="card" style={{ marginTop: 18 }}>
            <h2>📈 Şut Verimliliği</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
              <div className="stat-card"><b>FG%</b><span>{cell(topTeam.fg_pct, '%')}</span></div>
              <div className="stat-card"><b>3P%</b><span>{cell(topTeam.tp_pct, '%')}</span></div>
              <div className="stat-card"><b>FT%</b><span>{cell(topTeam.ft_pct, '%')}</span></div>
              <div className="stat-card"><b>TS%</b><span>{cell(topTeam.ts_pct, '%')}</span></div>
              <div className="stat-card"><b>eFG%</b><span>{cell(topTeam.efg_pct, '%')}</span></div>
            </div>
          </section>
        </>
      ) : null}

      {leaderCard('🥇 İlk 5 MVP Liderleri', starterLeaders)}
      {leaderCard('🔥 Bench MVP Liderleri', benchLeaders)}

      <section className="card" style={{ marginTop: 18, overflowX: 'auto' }}>
        <h2>İlk 5 / Bench Katkısı</h2>
        <table>
          <thead>
            <tr>
              <th>Takım</th>
              <th>Grup</th>
              <th>Oyuncu</th>
              <th>Dakika</th>
              <th>Sayı</th>
              <th>Rib.</th>
              <th>Asist</th>
              <th>TÇ</th>
              <th>Blok</th>
              <th>TK</th>
              <th>Faul</th>
              <th>VP</th>
              <th>Ort. MVP</th>
              <th>+/-</th>
            </tr>
          </thead>
          <tbody>
            {starterBench.length ? starterBench.map((r, i) => (
              <tr key={`${r.match_id}-${r.team_id}-${r.group_type}-${i}`}>
                <td><b>{r.team_name || r.team_id}</b></td>
                <td>{r.group_type === 'STARTER' ? 'İlk 5' : 'Bench'}</td>
                <td>{cell(r.player_count)}</td>
                <td>{cell(r.minutes)}</td>
                <td><b>{cell(r.points)}</b></td>
                <td>{cell(r.rebounds)}</td>
                <td>{cell(r.assists)}</td>
                <td>{cell(r.steals)}</td>
                <td>{cell(r.blocks)}</td>
                <td>{cell(r.turnovers)}</td>
                <td>{cell(r.fouls)}</td>
                <td><b>{cell(r.vp_score)}</b></td>
                <td><b>{cell(r.avg_mvp_score)}</b></td>
                <td><b>{cell(r.plus_minus)}</b></td>
              </tr>
            )) : (
              <tr><td colSpan={14}>İlk 5 / bench verisi bulunamadı.</td></tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="card" style={{ marginTop: 18, overflowX: 'auto' }}>
        <h2>Takım İstatistik Tablosu</h2>
        <table>
          <thead>
            <tr>
              <th>Takım</th>
              <th>Maç</th>
              <th>Sayı</th>
              <th>Rib.</th>
              <th>H.Rib.</th>
              <th>S.Rib.</th>
              <th>Asist</th>
              <th>TK</th>
              <th>TÇ</th>
              <th>Blok</th>
              <th>Faul</th>
              <th>FGM</th>
              <th>FGA</th>
              <th>FG%</th>
              <th>3PM</th>
              <th>3PA</th>
              <th>3P%</th>
              <th>FTM</th>
              <th>FTA</th>
              <th>FT%</th>
              <th>TS%</th>
              <th>eFG%</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? rows.map((r) => (
              <tr key={r.team_id}>
                <td><b>{r.team_name || r.team_id}</b></td>
                <td>{cell(r.games)}</td>
                <td><b>{cell(r.points)}</b></td>
                <td>{cell(r.rebounds)}</td>
                <td>{cell(r.offensive_rebounds)}</td>
                <td>{cell(r.defensive_rebounds)}</td>
                <td>{cell(r.assists)}</td>
                <td>{cell(r.turnovers)}</td>
                <td>{cell(r.steals)}</td>
                <td>{cell(r.blocks)}</td>
                <td>{cell(r.fouls)}</td>
                <td>{cell(r.fgm)}</td>
                <td>{cell(r.fga)}</td>
                <td><b>{cell(r.fg_pct, '%')}</b></td>
                <td>{cell(r.tpm)}</td>
                <td>{cell(r.tpa)}</td>
                <td><b>{cell(r.tp_pct, '%')}</b></td>
                <td>{cell(r.ftm)}</td>
                <td>{cell(r.fta)}</td>
                <td><b>{cell(r.ft_pct, '%')}</b></td>
                <td><b>{cell(r.ts_pct, '%')}</b></td>
                <td><b>{cell(r.efg_pct, '%')}</b></td>
              </tr>
            )) : (
              <tr><td colSpan={22}>Takım dashboard verisi bulunamadı.</td></tr>
            )}
          </tbody>
        </table>
      </section>
    </main>
  );
}
