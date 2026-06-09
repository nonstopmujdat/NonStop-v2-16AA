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

function cell(value: any, suffix = '') {
  if (value === null || value === undefined || value === '') return '-';
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  return `${n}${suffix}`;
}

export default async function MiniAdminTeamDashboardPage() {
  let rows: TeamDashboardRow[] = [];
  let errorMessage = '';

  if (hasSupabaseAdminConfig()) {
    const supabase = getSupabaseAdmin();
    const res = await supabase
      .from('live_team_dashboard')
      .select('*')
      .order('points', { ascending: false });

    rows = (res.data || []) as TeamDashboardRow[];
    errorMessage = res.error?.message || '';
  }

  const topTeam = rows[0];

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
          Bu ekran <b>live_team_dashboard</b> görünümünden takım bazlı istatistikleri okur.
          FG%, 3P%, FT%, TS% ve eFG% değerleri otomatik hesaplanır.
        </p>
        {errorMessage ? (
          <p><b>Supabase hata:</b> {errorMessage}</p>
        ) : null}
      </section>

      {topTeam ? (
        <section className="card" style={{ marginTop: 18 }}>
          <h2>Öne Çıkan Takım: {topTeam.team_name || topTeam.team_id}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
            <div className="stat-card"><b>Maç</b><span>{cell(topTeam.games)}</span></div>
            <div className="stat-card"><b>Sayı</b><span>{cell(topTeam.points)}</span></div>
            <div className="stat-card"><b>Ribaund</b><span>{cell(topTeam.rebounds)}</span></div>
            <div className="stat-card"><b>Asist</b><span>{cell(topTeam.assists)}</span></div>
            <div className="stat-card"><b>Top Kaybı</b><span>{cell(topTeam.turnovers)}</span></div>
            <div className="stat-card"><b>FG%</b><span>{cell(topTeam.fg_pct, '%')}</span></div>
            <div className="stat-card"><b>3P%</b><span>{cell(topTeam.tp_pct, '%')}</span></div>
            <div className="stat-card"><b>FT%</b><span>{cell(topTeam.ft_pct, '%')}</span></div>
          </div>
        </section>
      ) : null}

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

      <section className="card" style={{ marginTop: 18 }}>
        <h2>Not</h2>
        <p>
          TS% veya eFG% değeri normalden yüksek görünürse, bu genellikle takımın points / FGM / FGA
          verilerinden birinin test kayıtlarında uyumsuz yazıldığını gösterir. Canlı veri temizlendikçe
          bu oranlar doğru seviyeye gelecektir.
        </p>
      </section>
    </main>
  );
}
