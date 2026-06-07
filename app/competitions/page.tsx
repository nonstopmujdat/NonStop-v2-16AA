import Link from 'next/link';
import { getSupabaseAdmin, hasSupabaseAdminConfig } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

type CompetitionRow = {
  city_name: string | null;
  season_name: string | null;
  category_name: string | null;
  gender: string | null;
  competition_name: string | null;
  competition_type: string | null;
  league_level: string | null;
  is_independent: boolean | null;
  status: string | null;
  team_count: number | null;
};

function typeLabel(type?: string | null) {
  switch (type) {
    case 'LEAGUE': return 'Lig';
    case 'SEASON_GROUP': return 'Sezon/Grup';
    case 'TOURNAMENT': return 'Turnuva';
    case 'FRIENDLY': return 'Hazırlık';
    case 'SPECIAL_MATCH': return 'Özel Maç';
    default: return type || '-';
  }
}

export default async function CompetitionsPage() {
  if (!hasSupabaseAdminConfig()) {
    return (
      <main className="dashboard">
        <div className="topbar"><b>NONSTOP Organizasyonlar</b><Link href="/dashboard">Dashboard</Link></div>
        <div className="card">Supabase bağlantı ayarları eksik.</div>
      </main>
    );
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('live_competitions')
    .select('*')
    .order('city_name', { ascending: true })
    .order('category_name', { ascending: true })
    .order('competition_name', { ascending: true });

  const rows = (data || []) as CompetitionRow[];

  return (
    <main className="dashboard">
      <div className="topbar">
        <b>NONSTOP Organizasyonlar</b>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link href="/standings">Puan Durumu</Link>
          <Link href="/dashboard">Dashboard</Link>
        </div>
      </div>

      <section className="card">
        <h1>Ligler / Sezonlar / Turnuvalar / Özel Maçlar</h1>
        <p style={{ marginTop: 6 }}>
          Her il kendi bazında çalışır. A ve B ligleri bağımsız competition kayıtlarıdır.
        </p>
        {error ? <p style={{ color: '#b91c1c' }}>Supabase hata: {error.message}</p> : null}
        {!error && rows.length === 0 ? <p>Henüz organizasyon kaydı yok.</p> : null}
      </section>

      <section className="card">
        <div className="stats-table-wrap">
          <table className="stats-table">
            <thead>
              <tr>
                <th>İl</th>
                <th>Sezon</th>
                <th>Kategori</th>
                <th>Organizasyon</th>
                <th>Tip</th>
                <th>Lig</th>
                <th>Takım</th>
                <th>Durum</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={`${row.competition_name}-${idx}`}>
                  <td>{row.city_name || '-'}</td>
                  <td>{row.season_name || '-'}</td>
                  <td>{row.category_name || '-'} {row.gender ? `/${row.gender}` : ''}</td>
                  <td><b>{row.competition_name || '-'}</b></td>
                  <td>{typeLabel(row.competition_type)}</td>
                  <td>{row.league_level || 'NONE'}</td>
                  <td>{row.team_count ?? 0}</td>
                  <td>{row.status || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
