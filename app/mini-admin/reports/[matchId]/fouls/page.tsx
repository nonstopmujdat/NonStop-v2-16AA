import Link from 'next/link';
import { getSupabaseAdmin, hasSupabaseAdminConfig } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

function clamp(value: any, min: number, max: number, fallback: number) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function fallbackPoint(index: number) {
  const leftSide = index % 2 === 0;
  const baseX = leftSide ? 13 : 87;
  const baseY = 32 + ((index * 17) % 36);
  return { x: baseX, y: baseY };
}

function FoulCourtSvg({ fouls }: { fouls: any[] }) {
  return (
    <svg viewBox="0 0 940 500" style={{ width: '100%', maxWidth: 980, display: 'block', margin: '0 auto', background: '#f8fafc', border: '4px solid #111827', borderRadius: 18 }}>
      <rect x="0" y="0" width="940" height="500" fill="#f8fafc" />
      <rect x="18" y="18" width="904" height="464" fill="none" stroke="#111827" strokeWidth="5" />
      <line x1="470" y1="18" x2="470" y2="482" stroke="#111827" strokeWidth="4" />
      <circle cx="470" cy="250" r="62" fill="none" stroke="#111827" strokeWidth="4" />
      <rect x="18" y="145" width="170" height="210" fill="rgba(239,68,68,.16)" stroke="#111827" strokeWidth="4" />
      <rect x="752" y="145" width="170" height="210" fill="rgba(239,68,68,.16)" stroke="#111827" strokeWidth="4" />
      <circle cx="64" cy="250" r="9" fill="#111827" />
      <circle cx="876" cy="250" r="9" fill="#111827" />
      <path d="M 18 54 L 260 54 A 250 250 0 0 1 260 446 L 18 446" fill="none" stroke="#dc2626" strokeWidth="5" />
      <path d="M 922 54 L 680 54 A 250 250 0 0 0 680 446 L 922 446" fill="none" stroke="#dc2626" strokeWidth="5" />
      <text x="62" y="138" fontSize="18" fontWeight="900" fill="#991b1b">FAUL / BOYALI ALAN</text>
      <text x="720" y="138" fontSize="18" fontWeight="900" fill="#991b1b">FAUL / BOYALI ALAN</text>
      {fouls.map((f, i) => {
        let parsed: any = {};
        try {
          if (f.notes) parsed = typeof f.notes === 'string' ? JSON.parse(f.notes) : f.notes;
          if (parsed?.original_payload?.notes) {
            const inner = typeof parsed.original_payload.notes === 'string' ? JSON.parse(parsed.original_payload.notes) : parsed.original_payload.notes;
            parsed = { ...inner, ...parsed };
          }
        } catch(e) {}
        const realX = parsed.foul_x ?? f.x ?? f.event_x ?? f.court_x;
        const realY = parsed.foul_y ?? f.y ?? f.event_y ?? f.court_y;

        const fb = fallbackPoint(i);
        const x = clamp(realX, 0, 100, fb.x) * 9.4;
        const y = clamp(realY, 0, 100, fb.y) * 5;
        return (
          <g key={f.id || i} transform={`translate(${x} ${y})`}>
            <circle r="14" fill="#dc2626" stroke="#7f1d1d" strokeWidth="3" />
            <text textAnchor="middle" dominantBaseline="central" fontSize="14" fontWeight="900" fill="white">F</text>
            <text x="18" y="5" fontSize="14" fontWeight="900" fill="#111827">{f.player_id || i + 1}</text>
          </g>
        );
      })}
    </svg>
  );
}

export default async function FoulMapPdfPage({ params }: { params: { matchId: string } }) {
  const matchId = Number(params.matchId);
  let match: any = null;
  let fouls: any[] = [];

  if (hasSupabaseAdminConfig()) {
    const supabase = getSupabaseAdmin();
    const [matchRes, foulRes] = await Promise.all([
      supabase.from('operator_match_queue').select('*').eq('match_id', matchId).maybeSingle(),
      supabase.from('match_events').select('*').eq('match_id', matchId).order('id'),
    ]);
    match = matchRes.data;
    fouls = (foulRes.data || []).filter((e: any) => String(e.event_type || '').toUpperCase().includes('FOUL') || String(e.event_type || '').toUpperCase().includes('FAUL'));
  }

  return (
    <main className="dashboard printable-report">
      <div className="topbar no-print"><b>Faul Haritası PDF</b><div style={{ display: 'flex', gap: 12 }}><button id="printFoulButton">Yazdır</button><Link href="/mini-admin/reports">Geri</Link></div></div>
      <section className="card">
        <h1>NONSTOP Faul Haritası</h1>
        <p><b>Maç ID:</b> {matchId}</p>
        <p><b>Maç:</b> {match?.home_team_name || '-'} - {match?.away_team_name || '-'}</p>
        <p><b>Tarih/Saat:</b> {match?.match_date || '-'} {match?.match_time || ''}</p>
        <p>Faul noktası kaydı yoksa sistem faulleri boyalı alan üzerine sıralı gösterir. Saha koordinatları eklenince gerçek noktalar görünür.</p>
      </section>
      <section className="card" style={{ marginTop: 18 }}>
        <h2>Saha Üzeri Fauller</h2>
        <FoulCourtSvg fouls={fouls} />
        {fouls.length === 0 ? <p style={{ marginTop: 12 }}>Bu maç için faul olayı bulunamadı.</p> : null}
      </section>
      <section className="card" style={{ marginTop: 18 }}>
        <h2>Faul Listesi</h2>
        <table><thead><tr><th>ID</th><th>Periyot</th><th>Saat</th><th>Takım</th><th>Oyuncu</th><th>Olay</th></tr></thead><tbody>{fouls.map((f) => <tr key={f.id}><td>{f.id}</td><td>{f.quarter}</td><td>{f.game_clock || '-'}</td><td>{f.team_id}</td><td>{f.player_id || '-'}</td><td>{String(f.event_type)}</td></tr>)}</tbody></table>
      </section>
      <script dangerouslySetInnerHTML={{ __html: "document.getElementById('printFoulButton')?.addEventListener('click',()=>window.print())" }} />
    </main>
  );
}
