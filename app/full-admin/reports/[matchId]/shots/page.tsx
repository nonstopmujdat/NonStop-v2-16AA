import Link from 'next/link';
import { getSupabaseAdmin, hasSupabaseAdminConfig } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

function clamp(value: any, min: number, max: number, fallback: number) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function CourtSvg({ shots }: { shots: any[] }) {
  return (
    <svg viewBox="0 0 940 500" style={{ width: '100%', maxWidth: 980, display: 'block', margin: '0 auto', background: '#fff7ed', border: '4px solid #111827', borderRadius: 18 }}>
      <rect x="0" y="0" width="940" height="500" fill="#fff7ed" />
      <rect x="18" y="18" width="904" height="464" fill="none" stroke="#111827" strokeWidth="5" />
      <line x1="470" y1="18" x2="470" y2="482" stroke="#111827" strokeWidth="4" />
      <circle cx="470" cy="250" r="62" fill="none" stroke="#111827" strokeWidth="4" />

      {/* Sol pota ve boyalı alan */}
      <circle cx="64" cy="250" r="9" fill="#111827" />
      <line x1="34" y1="250" x2="64" y2="250" stroke="#111827" strokeWidth="5" />
      <rect x="18" y="145" width="170" height="210" fill="rgba(251,146,60,.22)" stroke="#111827" strokeWidth="4" />
      <rect x="18" y="190" width="72" height="120" fill="none" stroke="#111827" strokeWidth="3" />
      <circle cx="188" cy="250" r="60" fill="none" stroke="#111827" strokeWidth="4" />
      <path d="M 64 220 A 30 30 0 0 1 64 280" fill="none" stroke="#111827" strokeWidth="3" />
      <path d="M 18 54 L 260 54 A 250 250 0 0 1 260 446 L 18 446" fill="none" stroke="#dc2626" strokeWidth="5" />
      <text x="145" y="42" fontSize="22" fontWeight="900" fill="#dc2626">3 SAYI ÇİZGİSİ</text>
      <text x="64" y="138" fontSize="18" fontWeight="900" fill="#9a3412">BOYALI ALAN</text>

      {/* Sağ pota ve boyalı alan */}
      <circle cx="876" cy="250" r="9" fill="#111827" />
      <line x1="906" y1="250" x2="876" y2="250" stroke="#111827" strokeWidth="5" />
      <rect x="752" y="145" width="170" height="210" fill="rgba(251,146,60,.22)" stroke="#111827" strokeWidth="4" />
      <rect x="850" y="190" width="72" height="120" fill="none" stroke="#111827" strokeWidth="3" />
      <circle cx="752" cy="250" r="60" fill="none" stroke="#111827" strokeWidth="4" />
      <path d="M 876 220 A 30 30 0 0 0 876 280" fill="none" stroke="#111827" strokeWidth="3" />
      <path d="M 922 54 L 680 54 A 250 250 0 0 0 680 446 L 922 446" fill="none" stroke="#dc2626" strokeWidth="5" />
      <text x="690" y="42" fontSize="22" fontWeight="900" fill="#dc2626">3 SAYI ÇİZGİSİ</text>
      <text x="775" y="138" fontSize="18" fontWeight="900" fill="#9a3412">BOYALI ALAN</text>

      {shots.map((s, i) => {
        const x = clamp(s.x, 0, 100, 50) * 9.4;
        const y = clamp(s.y, 0, 100, 50) * 5;
        const made = Boolean(s.made);
        return (
          <g key={s.id || i} transform={`translate(${x} ${y})`}>
            {made ? (
              <circle r="11" fill="#16a34a" stroke="#064e3b" strokeWidth="3" />
            ) : (
              <g stroke="#dc2626" strokeWidth="5" strokeLinecap="round">
                <line x1="-10" y1="-10" x2="10" y2="10" />
                <line x1="10" y1="-10" x2="-10" y2="10" />
              </g>
            )}
            <text x="14" y="5" fontSize="14" fontWeight="900" fill="#111827">{s.player_id || s.shot_type || i + 1}</text>
          </g>
        );
      })}
    </svg>
  );
}

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
      <div className="topbar no-print"><b>Şut / Atış Haritası PDF</b><div style={{ display: 'flex', gap: 12 }}><button id="printShotButton">Yazdır</button><Link href="/full-admin/reports">Geri</Link></div></div>
      <section className="card">
        <h1>NONSTOP Şut / Atış Haritası</h1>
        <p><b>Maç ID:</b> {matchId}</p>
        <p><b>Maç:</b> {match?.home_team_name || '-'} - {match?.away_team_name || '-'}</p>
        <p><b>Tarih/Saat:</b> {match?.match_date || '-'} {match?.match_time || ''}</p>
        <p><b>Açıklama:</b> Yeşil nokta isabetli atış, kırmızı çarpı kaçan atıştır. Kırmızı yaylar 3 sayı çizgisidir; turuncu bölüm boyalı alandır.</p>
      </section>
      <section className="card" style={{ marginTop: 18 }}>
        <h2>Basketbol Sahası Üzeri Atışlar</h2>
        <CourtSvg shots={shots} />
        {shots.length === 0 ? <p style={{ marginTop: 12 }}>Bu maç için kayıtlı şut noktası yok. İleride operatör ekranında saha üzerinden nokta seçildiğinde burada görünecek.</p> : null}
      </section>
      <section className="card" style={{ marginTop: 18 }}>
        <h2>Atış Listesi</h2>
        <table><thead><tr><th>ID</th><th>X</th><th>Y</th><th>Tip</th><th>Bölge</th><th>İsabet</th></tr></thead><tbody>{shots.map((s) => <tr key={s.id}><td>{s.id}</td><td>{s.x}</td><td>{s.y}</td><td>{s.shot_type || '-'}</td><td>{s.shot_zone || '-'}</td><td>{s.made ? 'Evet' : 'Hayır'}</td></tr>)}</tbody></table>
      </section>
      <script dangerouslySetInnerHTML={{ __html: "document.getElementById('printShotButton')?.addEventListener('click',()=>window.print())" }} />
    </main>
  );
}
