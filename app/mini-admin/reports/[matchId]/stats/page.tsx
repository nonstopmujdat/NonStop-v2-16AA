import Link from 'next/link';
import { getSupabaseAdmin, hasSupabaseAdminConfig } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

type BasicRow = {
  team_id?: number | string | null;
  player_id?: number | string | null;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fouls: number;
  events: number;
};

type AdvancedRow = {
  match_id: number;
  team_id: number | null;
  team_name: string | null;
  player_id: number | null;
  player_name: string | null;
  two_pm: number;
  two_pa: number;
  three_pm: number;
  three_pa: number;
  ftm: number;
  fta: number;
  pts: number;
  oreb: number;
  dreb: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  tov: number;
  pf: number;
  fd: number;
  fg_percentage: number;
  threep_percentage: number;
  ft_percentage: number;
  ts_percentage: number;
  efg_percentage: number;
  ast_tov_ratio: number;
  vp_score: number;
  perf40: number;
  mvp_score: number;
};

function groupEvents(events: any[]): BasicRow[] {
  const map = new Map<string, BasicRow>();

  for (const e of events) {
    const key = `${e.team_id || '-'}:${e.player_id || '-'}`;
    const row = map.get(key) || {
      team_id: e.team_id,
      player_id: e.player_id,
      points: 0,
      rebounds: 0,
      assists: 0,
      steals: 0,
      blocks: 0,
      turnovers: 0,
      fouls: 0,
      events: 0,
    };

    const type = String(e.event_type || '').toUpperCase();
    row.events += 1;

    if (type.includes('POINT') || type.includes('BASKET') || type.includes('SCORE')) {
      row.points += Number(e.points || 0) || 0;
    }
    if (type.includes('REBOUND') || type.includes('RIBAUND') || type === 'OREB' || type === 'DREB') row.rebounds += 1;
    if (type.includes('ASSIST') || type.includes('ASIST') || type === 'AST') row.assists += 1;
    if (type.includes('STEAL') || type.includes('TOP_CALMA') || type === 'STL') row.steals += 1;
    if (type.includes('BLOCK') || type.includes('BLOK') || type === 'BLK') row.blocks += 1;
    if (type.includes('TURNOVER') || type.includes('TOP_KAYBI') || type === 'TOV') row.turnovers += 1;
    if (type.includes('FOUL') || type.includes('FAUL') || type === 'PF') row.fouls += 1;

    map.set(key, row);
  }

  return Array.from(map.values());
}

function numberCell(value: any, suffix = '') {
  if (value === null || value === undefined || value === '') return '-';
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  return `${n}${suffix}`;
}

export default async function MatchStatsPdfPage({ params }: { params: { matchId: string } }) {
  const matchId = Number(params.matchId);
  let match: any = null;
  let events: any[] = [];
  let rows: BasicRow[] = [];
  let advancedRows: AdvancedRow[] = [];
  let advancedError = '';

  if (hasSupabaseAdminConfig()) {
    const supabase = getSupabaseAdmin();
    const [matchRes, eventRes, advancedRes] = await Promise.all([
      supabase.from('operator_match_queue').select('*').eq('match_id', matchId).maybeSingle(),
      supabase.from('match_events').select('*').eq('match_id', matchId).order('id'),
      supabase.from('live_player_advanced_stats').select('*').eq('match_id', matchId).order('team_id').order('player_id'),
    ]);

    match = matchRes.data;
    events = eventRes.data || [];
    rows = groupEvents(events);
    advancedRows = (advancedRes.data || []) as AdvancedRow[];
    advancedError = advancedRes.error?.message || '';
  }

  return (
    <main className="dashboard printable-report">
      <div className="topbar no-print">
        <b>İstatistik PDF</b>
        <div>
          <button id="printTopButton">Yazdır</button>
          <Link href="/mini-admin/reports">Geri</Link>
        </div>
      </div>

      <section className="card">
        <h1>NONSTOP Maç İstatistik Raporu</h1>
        <p><b>Maç ID:</b> {matchId}</p>
        <p><b>Organizasyon:</b> {match?.competition_name || '-'}</p>
        <p><b>Salon:</b> {match?.venue_name || '-'}</p>
        <p><b>Ev Sahibi:</b> {match?.home_team_name || '-'}</p>
        <p><b>Misafir:</b> {match?.away_team_name || '-'}</p>
        <p><b>Skor:</b> {match?.home_score ?? 0} - {match?.away_score ?? 0}</p>
        <p className="no-print"><button type="button" id="printButton">PDF Yazdır</button></p>
      </section>

      <section className="card" style={{ marginTop: 18, overflowX: 'auto' }}>
        <h2>Gelişmiş Oyuncu İstatistikleri</h2>
        <p style={{ marginTop: 0 }}>
          VP = ham performans, Perf40 = süreye göre verim, MVP = maçın en değerli oyuncusu puanı.
        </p>

        {advancedError ? (
          <p><b>Uyarı:</b> live_player_advanced_stats görünümü okunamadı. Hata: {advancedError}</p>
        ) : null}

        <table>
          <thead>
            <tr>
              <th>Takım</th>
              <th>Oyuncu</th>
              <th>2PM</th>
              <th>2PA</th>
              <th>3PM</th>
              <th>3PA</th>
              <th>FTM</th>
              <th>FTA</th>
              <th>PTS</th>
              <th>REB</th>
              <th>AST</th>
              <th>STL</th>
              <th>BLK</th>
              <th>TOV</th>
              <th>PF</th>
              <th>FD</th>
              <th>FG%</th>
              <th>3P%</th>
              <th>FT%</th>
              <th>TS%</th>
              <th>eFG%</th>
              <th>AST/TOV</th>
              <th>VP</th>
              <th>Perf40</th>
              <th>MVP</th>
            </tr>
          </thead>
          <tbody>
            {advancedRows.length ? advancedRows.map((r, i) => (
              <tr key={`${r.match_id}-${r.team_id}-${r.player_id}-${i}`}>
                <td>{r.team_name || r.team_id || '-'}</td>
                <td>{r.player_name || r.player_id || '-'}</td>
                <td>{numberCell(r.two_pm)}</td>
                <td>{numberCell(r.two_pa)}</td>
                <td>{numberCell(r.three_pm)}</td>
                <td>{numberCell(r.three_pa)}</td>
                <td>{numberCell(r.ftm)}</td>
                <td>{numberCell(r.fta)}</td>
                <td><b>{numberCell(r.pts)}</b></td>
                <td>{numberCell(r.reb)}</td>
                <td>{numberCell(r.ast)}</td>
                <td>{numberCell(r.stl)}</td>
                <td>{numberCell(r.blk)}</td>
                <td>{numberCell(r.tov)}</td>
                <td>{numberCell(r.pf)}</td>
                <td>{numberCell(r.fd)}</td>
                <td>{numberCell(r.fg_percentage, '%')}</td>
                <td>{numberCell(r.threep_percentage, '%')}</td>
                <td>{numberCell(r.ft_percentage, '%')}</td>
                <td><b>{numberCell(r.ts_percentage, '%')}</b></td>
                <td><b>{numberCell(r.efg_percentage, '%')}</b></td>
                <td>{numberCell(r.ast_tov_ratio)}</td>
                <td><b>{numberCell(r.vp_score)}</b></td>
                <td><b>{numberCell(r.perf40)}</b></td>
                <td><b>{numberCell(r.mvp_score)}</b></td>
              </tr>
            )) : (
              <tr><td colSpan={25}>Bu maç için gelişmiş istatistik verisi bulunamadı.</td></tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="card" style={{ marginTop: 18, overflowX: 'auto' }}>
        <h2>Temel Olay Özeti</h2>
        <table>
          <thead>
            <tr>
              <th>Takım ID</th>
              <th>Oyuncu ID</th>
              <th>Sayı</th>
              <th>Ribaund</th>
              <th>Asist</th>
              <th>Top Çalma</th>
              <th>Blok</th>
              <th>Top Kaybı</th>
              <th>Faul</th>
              <th>Olay</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? rows.map((r, i) => (
              <tr key={i}>
                <td>{r.team_id || '-'}</td>
                <td>{r.player_id || '-'}</td>
                <td>{r.points}</td>
                <td>{r.rebounds}</td>
                <td>{r.assists}</td>
                <td>{r.steals}</td>
                <td>{r.blocks}</td>
                <td>{r.turnovers}</td>
                <td>{r.fouls}</td>
                <td>{r.events}</td>
              </tr>
            )) : (
              <tr><td colSpan={10}>Bu maç için olay kaydı bulunamadı.</td></tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="card" style={{ marginTop: 18, overflowX: 'auto' }}>
        <h2>Ham Olay Listesi</h2>
        <table>
          <thead>
            <tr><th>ID</th><th>Periyot</th><th>Saat</th><th>Takım</th><th>Oyuncu</th><th>Olay</th></tr>
          </thead>
          <tbody>
            {events.length ? events.map((e) => (
              <tr key={e.id}>
                <td>{e.id}</td>
                <td>{e.quarter}</td>
                <td>{e.game_clock || '-'}</td>
                <td>{e.team_id}</td>
                <td>{e.player_id || '-'}</td>
                <td>{String(e.event_type)}</td>
              </tr>
            )) : (
              <tr><td colSpan={6}>Ham olay kaydı bulunamadı.</td></tr>
            )}
          </tbody>
        </table>
      </section>

      <script dangerouslySetInnerHTML={{ __html: "document.getElementById('printButton')?.addEventListener('click',()=>window.print());document.getElementById('printTopButton')?.addEventListener('click',()=>window.print())" }} />
    </main>
  );
}
