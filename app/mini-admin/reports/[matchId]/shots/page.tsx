import Link from 'next/link';
import { getSupabaseAdmin, hasSupabaseAdminConfig } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export default async function ShotMapPdfPage({ params }: { params: { matchId: string } }) {
  const matchId = Number(params.matchId);
  let match: any = null;
  let shots: any[] = [];
  if (hasSupabaseAdminConfig()) {
    const supabase = getSupabaseAdmin();
    const matchRes = await supabase.from('operator_match_queue').select('*').eq('match_id', matchId).maybeSingle();
    match = matchRes.data;
    const eventRes = await supabase.from('match_events').select('id').eq('match_id', matchId);
    const eventIds = (eventRes.data || []).map((e: any) => e.id);
    if (eventIds.length > 0) {
      const shotRes = await supabase.from('shot_events').select('*').in('match_event_id', eventIds).order('id');
      shots = shotRes.data || [];
    }
  }
  return (
    <main className="dashboard printable-report">
      <div className="topbar no-print"><b>Şut Haritası PDF</b><div><button id="printShotButton">Yazdır</button><Link href="/mini-admin/reports">Geri</Link></div></div>
      <section className="card">
        <h1>NONSTOP Şut / Atış Haritası</h1>
        <p><b>Maç ID:</b> {matchId}</p>
        <p><b>Maç:</b> {match?.home_team_name || '-'} - {match?.away_team_name || '-'}</p>
        <p><b>Tarih/Saat:</b> {match?.match_date || '-'} {match?.match_time || ''}</p>
      </section>
      <section className="card" style={{ marginTop: 18 }}>
        <h2>Saha Üzeri Atışlar</h2>
        <div style={{ position: 'relative', width: '100%', maxWidth: 820, height: 460, border: '3px solid currentColor', borderRadius: 18, margin: '20px auto', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, borderLeft: '2px solid currentColor' }} />
          <div style={{ position: 'absolute', left: '9%', top: '28%', width: '18%', height: '44%', border: '2px solid currentColor' }} />
          <div style={{ position: 'absolute', right: '9%', top: '28%', width: '18%', height: '44%', border: '2px solid currentColor' }} />
          <div style={{ position: 'absolute', left: '5%', top: '45%', width: 12, height: 12, borderRadius: 99, background: 'currentColor' }} />
          <div style={{ position: 'absolute', right: '5%', top: '45%', width: 12, height: 12, borderRadius: 99, background: 'currentColor' }} />
          {shots.map((s, i) => {
            const left = Math.max(2, Math.min(98, Number(s.x ?? 50)));
            const top = Math.max(2, Math.min(98, Number(s.y ?? 50)));
            return <span key={s.id || i} title={s.label || ''} style={{ position: 'absolute', left: `${left}%`, top: `${top}%`, transform: 'translate(-50%,-50%)', fontWeight: 900, fontSize: 18 }}>{s.made ? '●' : '×'}</span>;
          })}
        </div>
        <p><b>●</b> İsabet, <b>×</b> kaçan atış. PDF almak için tarayıcıda Yazdır → PDF olarak kaydet seç.</p>
      </section>
      <section className="card" style={{ marginTop: 18 }}>
        <h2>Atış Listesi</h2>
        <table><thead><tr><th>ID</th><th>X</th><th>Y</th><th>Tip</th><th>Bölge</th><th>İsabet</th></tr></thead><tbody>{shots.map((s) => <tr key={s.id}><td>{s.id}</td><td>{s.x}</td><td>{s.y}</td><td>{s.shot_type || '-'}</td><td>{s.shot_zone || '-'}</td><td>{s.made ? 'Evet' : 'Hayır'}</td></tr>)}</tbody></table>
      </section>
      <script dangerouslySetInnerHTML={{ __html: "document.getElementById('printShotButton')?.addEventListener('click',()=>window.print())" }} />
    </main>
  );
}
