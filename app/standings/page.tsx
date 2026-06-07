import Link from 'next/link';
import { getSupabaseAdmin, hasSupabaseAdminConfig } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

type StandingRow = {
  rank: number | null;
  city_name: string | null;
  season_name: string | null;
  category_name: string | null;
  gender: string | null;
  competition_name: string | null;
  competition_type: string | null;
  league_name: string | null;
  league_level: string | null;
  team_name: string | null;
  o: number | null;
  g: number | null;
  m: number | null;
  asayi: number | null;
  ysayi: number | null;
  av: number | null;
  p: number | null;
  h2h_points: number | null;
  h2h_point_diff: number | null;
};

function groupKey(row: StandingRow) {
  return [
    row.city_name || 'İl yok',
    row.season_name || 'Sezon yok',
    row.category_name || 'Kategori yok',
    row.gender || '',
    row.competition_name || row.league_name || `Lig ${row.league_level || ''}`,
  ].join(' / ');
}

export default async function StandingsPage() {
  if (!hasSupabaseAdminConfig()) {
    return (
      <main className="dashboard">
        <div className="topbar"><b>NONSTOP Puan Durumu</b><Link href="/dashboard">Dashboard</Link></div>
        <div className="card">Supabase bağlantı ayarları eksik.</div>
      </main>
    );
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('live_league_standings')
    .select('*')
    .order('city_name', { ascending: true })
    .order('category_name', { ascending: true })
    .order('league_level', { ascending: true })
    .order('rank', { ascending: true });

  const rows = (data || []) as StandingRow[];
  const groups = new Map<string, StandingRow[]>();
  rows.forEach((row) => {
    const key = groupKey(row);
    groups.set(key, [...(groups.get(key) || []), row]);
  });

  return (
    <main className="dashboard">
      <div className="topbar">
        <b>NONSTOP Puan Durumu</b>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link href="/live">Canlı</Link>
          <Link href="/operator">Operatör</Link>
          <Link href="/dashboard">Dashboard</Link>
        </div>
      </div>

      <section className="card">
        <h1>İl Bazlı Bağımsız Lig Puan Durumu</h1>
        <p style={{ marginTop: 6 }}>
          Sıralama: Puan → eşit takımlar arası maç/puan → eşit takımlar arası averaj → genel averaj → atılan sayı.
          Lig, turnuva ve özel maç organizasyonları competition yapısında tutulur. A/B ligleri bağımsızdır.
        </p>
        {error ? <p style={{ color: '#b91c1c' }}>Supabase hata: {error.message}</p> : null}
        {!error && rows.length === 0 ? <p>Henüz puan durumu verisi yok. Önce sezon, lig ve takım bağlantıları kurulmalı.</p> : null}
      </section>

      {Array.from(groups.entries()).map(([title, groupRows]) => (
        <section className="card" key={title}>
          <h2>{title}</h2>
          <div className="stats-table-wrap">
            <table className="stats-table">
              <thead>
                <tr>
                  <th>Sıra</th>
                  <th>Takım</th>
                  <th>O</th>
                  <th>G</th>
                  <th>M</th>
                  <th>AS</th>
                  <th>YS</th>
                  <th>AV</th>
                  <th>P</th>
                </tr>
              </thead>
              <tbody>
                {groupRows.map((row, idx) => (
                  <tr key={`${title}-${row.team_name}-${idx}`}>
                    <td>{row.rank ?? '-'}</td>
                    <td><b>{row.team_name || '-'}</b></td>
                    <td>{row.o ?? 0}</td>
                    <td>{row.g ?? 0}</td>
                    <td>{row.m ?? 0}</td>
                    <td>{row.asayi ?? 0}</td>
                    <td>{row.ysayi ?? 0}</td>
                    <td>{row.av ?? 0}</td>
                    <td><b>{row.p ?? 0}</b></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </main>
  );
}
