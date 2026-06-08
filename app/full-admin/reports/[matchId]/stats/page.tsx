import Link from 'next/link';
import { getSupabaseAdmin, hasSupabaseAdminConfig } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

function groupEvents(events: any[]) {
  const map = new Map<string, any>();
  for (const e of events) {
    const key = `${e.team_id || '-'}:${e.player_id || '-'}`;
    const row = map.get(key) || { team_id: e.team_id, player_id: e.player_id, points: 0, rebounds: 0, assists: 0, steals: 0, blocks: 0, turnovers: 0, fouls: 0, events: 0 };
    const type = String(e.event_type || '').toUpperCase();
    row.events += 1;
    if (type.includes('POINT') || type.includes('BASKET') || type.includes('SCORE')) row.points += Number(e.points || 0) || 0;
    if (type.includes('REBOUND') || type.includes('RIBAUND')) row.rebounds += 1;
    if (type.includes('ASSIST') || type.includes('ASIST')) row.assists += 1;
    if (type.includes('STEAL') || type.includes('TOP_CALMA')) row.steals += 1;
    if (type.includes('BLOCK') || type.includes('BLOK')) row.blocks += 1;
    if (type.includes('TURNOVER') || type.includes('TOP_KAYBI')) row.turnovers += 1;
    if (type.includes('FOUL') || type.includes('FAUL')) row.fouls += 1;
    map.set(key, row);
  }
  return Array.from(map.values());
}

export default async function MatchStatsPdfPage({ params }: { params: { matchId: string } }) {
  const matchId = Number(params.matchId);
  let match: any = null;
  let events: any[] = [];
  let rows: any[] = [];
  if (hasSupabaseAdminConfig()) {
    const supabase = getSupabaseAdmin();
    const [matchRes, eventRes] = await Promise.all([
      supabase.from('operator_match_queue').select('*').eq('match_id', matchId).maybeSingle(),
      supabase.from('match_events').select('*').eq('match_id', matchId).order('id'),
    ]);
    match = matchRes.data;
    events = eventRes.data || [];
    rows = groupEvents(events);
  }
  return (
    <main className="dashboard printable-report">
      <div className="topbar no-print"><b>İstatistik PDF</b><div><button id="printTopButton">Yazdır</button><Link href="/full-admin/reports">Geri</Link></div></div>
      <script dangerouslySetInnerHTML={{ __html: "function printReport(){window.print()}" }} />
      <section className="card">
        <h1>NONSTOP Maç İstatistik Raporu</h1>
        <p><b>Maç ID:</b> {matchId}</p>
        <p><b>Maç:</b> {match?.home_team_name || '-'} - {match?.away_team_name || '-'}</p>
        <p><b>Tarih/Saat:</b> {match?.match_date || '-'} {match?.match_time || ''}</p>
        <p><b>Salon:</b> {match?.venue_name || '-'}</p>
        <p><b>Skor:</b> {match?.home_score ?? 0} - {match?.away_score ?? 0}</p>
        <p className="no-print"><button type="button" id="printButton">PDF Yazdır</button></p>
      </section>
      <section className="card" style={{ marginTop: 18 }}>
        <h2>Oyuncu / Takım Olay Özeti</h2>
        <table><thead><tr><th>Takım ID</th><th>Oyuncu ID</th><th>Sayı</th><th>Rib.</th><th>Asist</th><th>Top Ç.</th><th>Blok</th><th>TK</th><th>Faul</th><th>Olay</th></tr></thead><tbody>{rows.map((r, i) => <tr key={i}><td>{r.team_id || '-'}</td><td>{r.player_id || '-'}</td><td>{r.points}</td><td>{r.rebounds}</td><td>{r.assists}</td><td>{r.steals}</td><td>{r.blocks}</td><td>{r.turnovers}</td><td>{r.fouls}</td><td>{r.events}</td></tr>)}</tbody></table>
      </section>
      <section className="card" style={{ marginTop: 18 }}>
        <h2>Ham Olay Listesi</h2>
        <table><thead><tr><th>ID</th><th>Periyot</th><th>Saat</th><th>Takım</th><th>Oyuncu</th><th>Olay</th></tr></thead><tbody>{events.map((e) => <tr key={e.id}><td>{e.id}</td><td>{e.quarter}</td><td>{e.game_clock || '-'}</td><td>{e.team_id}</td><td>{e.player_id || '-'}</td><td>{String(e.event_type)}</td></tr>)}</tbody></table>
      </section>
      <script dangerouslySetInnerHTML={{ __html: "document.getElementById('printButton')?.addEventListener('click',()=>window.print());document.getElementById('printTopButton')?.addEventListener('click',()=>window.print())" }} />
    </main>
  );
}
