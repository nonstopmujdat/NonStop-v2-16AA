import Link from 'next/link';
import { getSupabaseAdmin, hasSupabaseAdminConfig } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export default async function MiniAdminReportsPage() {
  let matches: any[] = [];
  if (hasSupabaseAdminConfig()) {
    const supabase = getSupabaseAdmin();
    const res = await supabase.from('operator_match_queue').select('*').order('match_date', { ascending: false }).limit(50);
    matches = res.data || [];
  }
  return (
    <main className="dashboard">
      <div className="topbar"><b>Full Admin / PDF Raporlar</b><div><Link href="/full-admin">Mini Admin</Link></div></div>
      <section className="card">
        <h1>📄 Maç PDF Raporları</h1>
        <p>Maç istatistik raporu, saha üzeri şut/atış haritası ve faul haritası ayrı ayrı yazdırılabilir. Tarayıcıdan <b>Yazdır → PDF olarak kaydet</b> seç.</p>
      </section>
      <section className="card" style={{ marginTop: 18 }}>
        <h2>Maçlar</h2>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead><tr><th>ID</th><th>Tarih</th><th>Saat</th><th>Salon</th><th>Maç</th><th>Rapor</th></tr></thead>
            <tbody>{matches.map((m) => <tr key={m.match_id}>
              <td>{m.match_id}</td><td>{m.match_date || '-'}</td><td>{m.match_time || '-'}</td><td>{m.venue_name || '-'}</td>
              <td>{m.home_team_name || '-'} - {m.away_team_name || '-'}</td>
              <td style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><Link href={`/full-admin/reports/${m.match_id}/stats`}>İstatistik PDF</Link><Link href={`/full-admin/reports/${m.match_id}/shots`}>Şut Haritası PDF</Link><Link href={`/full-admin/reports/${m.match_id}/fouls`}>Faul Haritası PDF</Link></td>
            </tr>)}</tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
